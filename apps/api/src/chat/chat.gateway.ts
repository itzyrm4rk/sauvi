import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({ cors: true, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake?.auth?.token;
    if (!token) {
      this.logger.warn(`Connexion WebSocket rejetée (pas de token) : ${client.id}`);
      client.disconnect();
      return;
    }

    const payload = await this.authService.verifyWsToken(token);
    if (!payload) {
      this.logger.warn(`Connexion WebSocket rejetée (token invalide) : ${client.id}`);
      client.disconnect();
      return;
    }

    client.data.user = payload;
    this.logger.log(`Client connecté au namespace /chat: ${client.id} (User: ${payload.sub})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté du namespace /chat: ${client.id}`);
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sosId: string; roomId: string },
  ) {
    const roomName = `chat:${data.sosId}:${data.roomId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} a rejoint le chat ${roomName}`);
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sosId: string; roomId: string },
  ) {
    const roomName = `chat:${data.sosId}:${data.roomId}`;
    client.leave(roomName);
    this.logger.log(`Client ${client.id} a quitté le chat ${roomName}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sosId: string; userId: string; roomId: string },
  ) {
    client
      .to(`chat:${data.sosId}:${data.roomId}`)
      .emit('typing', { userId: data.userId, isTyping: true });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sosId: string; userId: string; roomId: string },
  ) {
    client
      .to(`chat:${data.sosId}:${data.roomId}`)
      .emit('typing', { userId: data.userId, isTyping: false });
  }

  emitNewMessage(sosId: string, roomId: string, message: unknown) {
    this.server.to(`chat:${sosId}:${roomId}`).emit('message:new', message);
  }

  emitReadAck(sosId: string, roomId: string, readByUserId: string) {
    this.server.to(`chat:${sosId}:${roomId}`).emit('message:read_ack', { sosId, readByUserId });
  }

  emitChatClosed(sosId: string) {
    this.server.to(`chat:${sosId}`).emit('chat:closed', { sosId });
  }

  isUserInChatRoom(sosId: string, roomId: string, userId: string): boolean {
    const roomName = `chat:${sosId}:${roomId}`;
    const socketsInRoom = this.server?.sockets?.adapter?.rooms?.get(roomName);
    if (!socketsInRoom || socketsInRoom.size === 0) return false;

    for (const socketId of socketsInRoom) {
      const clientSocket = this.server.sockets.sockets.get(socketId);
      if (clientSocket?.data?.user?.sub === userId) {
        return true;
      }
    }
    return false;
  }
}
