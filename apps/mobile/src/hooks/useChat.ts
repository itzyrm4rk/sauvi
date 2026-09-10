import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { type Socket, io } from 'socket.io-client';
import { env } from '../config/env';
import { useGetMeQuery } from '../store/api/usersApi';
import type { RootState } from '../store/index';

export interface ChatMessage {
  id: string;
  sosId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  pending?: boolean;
  failed?: boolean;
}

const baseUrl = env.EXPO_PUBLIC_API_URL.replace('/api', '');
const SOCKET_URL = `${baseUrl}/chat`;

export function useChat(sosId: string, contactId: string, initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [...initialMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const token = useSelector((state: RootState) => state.auth.accessToken);
  const { data: userResponse } = useGetMeQuery();
  const currentUser = userResponse?.data;

  useEffect(() => {
    if (!token || !sosId) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
    });

    const roomId = currentUser?.id ? [currentUser.id, contactId].sort().join('_') : null;

    newSocket.on('connect', () => {
      if (roomId) newSocket.emit('join_chat', { sosId, roomId });
    });

    newSocket.on('message:new', (message: ChatMessage) => {
      if (message.sosId === sosId) {
        setMessages((prev) => {
          const filtered = prev.filter(
            (m) => !(m.pending && m.content === message.content && m.senderId === message.senderId),
          );
          return [...filtered, message];
        });

        if (message.senderId !== currentUser?.id) {
          setIsTyping(false);
          setTypingUser(null);
        }
      }
    });

    newSocket.on('message:read_ack', (data: { sosId: string; readByUserId: string }) => {
      if (data.sosId === sosId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === currentUser?.id ? { ...m, read: true } : m)),
        );
      }
    });

    newSocket.on('typing', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== currentUser?.id) {
        setIsTyping(data.isTyping);
        setTypingUser(data.isTyping ? data.userId : null);
      }
    });

    setSocket(newSocket);

    return () => {
      if (roomId) newSocket.emit('leave_chat', { sosId, roomId });
      newSocket.disconnect();
    };
  }, [sosId, contactId, token, currentUser?.id]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !currentUser) return;

      const tempId = `temp-${Date.now()}`;
      const pendingMsg: ChatMessage = {
        id: tempId,
        sosId,
        senderId: currentUser.id,
        content,
        read: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name || '',
          avatarUrl: currentUser.avatarUrl || null,
        },
        pending: true,
      };

      setMessages((prev) => [...prev, pendingMsg]);

      return pendingMsg;
    },
    [sosId, currentUser],
  );

  const emitTyping = useCallback(
    (typing: boolean) => {
      if (socket && currentUser) {
        const roomId = [currentUser.id, contactId].sort().join('_');
        socket.emit(typing ? 'typing:start' : 'typing:stop', {
          sosId,
          userId: currentUser.id,
          roomId,
        });
      }
    },
    [socket, sosId, contactId, currentUser],
  );

  return {
    messages,
    setMessages,
    sendMessage,
    emitTyping,
    isTyping,
    typingUser,
  };
}
