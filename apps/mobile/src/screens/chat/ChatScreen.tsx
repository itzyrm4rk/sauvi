import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  Check,
  CheckCheck,
  ChevronLeft,
  Lock,
  Phone,
  Send,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PublicProfileModal } from '../../components/profile/PublicProfileModal';
import { Avatar } from '../../components/ui/Avatar';
import { colors, spacing, typography } from '../../constants/theme';
import { type ChatMessage, useChat } from '../../hooks/useChat';
import { useNativeCall } from '../../hooks/useNativeCall';
import {
  useGetMessagesQuery,
  useMarkAsReadMutation,
  useSendMessageRestMutation,
} from '../../store/api/chatApi';
import { useGetSosByIdQuery, useGetWaitlistQuery } from '../../store/api/sosApi';
import { useGetMeQuery, useGetPublicProfileQuery } from '../../store/api/usersApi';
import type { SosStackParamList } from '../../types/navigation.types';

export function ChatScreen() {
  const route = useRoute<RouteProp<SosStackParamList, 'Chat'>>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { sosId, contactId, contactName, contactPhone, isClosed } = route.params;

  const [input, setInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { data: userResponse } = useGetMeQuery();
  const currentUser = userResponse?.data;
  const { call } = useNativeCall();

  // Profil public du contact (pour avatar et modal)
  const { data: contactProfileResp } = useGetPublicProfileQuery(
    { userId: contactId },
    { skip: !contactId },
  );

  const { data: initialData, isLoading } = useGetMessagesQuery({ sosId, contactId });
  const { data: sosResponse } = useGetSosByIdQuery({ sosId });
  const sos = sosResponse?.data;
  const { data: waitlistResponse } = useGetWaitlistQuery({ sosId });
  const waitlist = waitlistResponse?.data || [];
  const [sendMessageRest] = useSendMessageRestMutation();
  const [markAsRead] = useMarkAsReadMutation();

  const participantEntry = waitlist.find(
    (entry) => entry.donorId === currentUser?.id || entry.donorId === contactId,
  );

  const contactAvatarUrl =
    contactProfileResp?.data?.avatarUrl || participantEntry?.donor?.avatarUrl;

  // Masquer la barre d'onglets pour ne pas bloquer le champ de saisie
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({
      tabBarStyle: { display: 'none' },
    });
    return () => {
      parent?.setOptions({
        tabBarStyle: undefined,
      });
    };
  }, [navigation]);

  // Écoute de l'affichage du clavier pour ajuster la vue
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isActuallyClosed =
    isClosed ||
    sos?.status === 'fulfilled' ||
    sos?.status === 'closed' ||
    sos?.status === 'expired' ||
    participantEntry?.status === 'donated' ||
    participantEntry?.status === 'cancelled' ||
    participantEntry?.status === 'rejected';

  const { messages, setMessages, sendMessage, emitTyping, isTyping } = useChat(
    sosId,
    contactId,
    initialData?.data || [],
  );

  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 100);
  }, []);

  useEffect(() => {
    if (initialData?.data) {
      const sorted = [...initialData.data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setMessages(sorted);
    }
  }, [initialData, setMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      markAsRead({ sosId, contactId });
      scrollToBottom();
    }
  }, [messages.length, sosId, contactId, markAsRead, scrollToBottom]);

  const trySendMessage = useCallback(
    async (msgId: string, content: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, pending: true, failed: false } : m)),
      );
      try {
        const result = await sendMessageRest({ sosId, contactId, content }).unwrap();
        setMessages((prev) => prev.map((m) => (m.id === msgId ? result.data : m)));
      } catch (_e) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, pending: false, failed: true } : m)),
        );
      }
    },
    [setMessages, sendMessageRest, sosId, contactId],
  );

  const handleSend = async () => {
    if (!input.trim() || isActuallyClosed) return;

    const content = input.trim();
    setInput('');
    emitTyping(false);

    const pendingMsg = sendMessage(content);

    if (pendingMsg) {
      await trySendMessage(pendingMsg.id, content);
    }
  };

  const handleRetry = useCallback(
    (msg: ChatMessage) => {
      if (isActuallyClosed) return;
      trySendMessage(msg.id, msg.content);
    },
    [isActuallyClosed, trySendMessage],
  );

  const handleTextChange = useCallback(
    (text: string) => {
      setInput(text);
      emitTyping(text.length > 0);
    },
    [emitTyping],
  );

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isMe = item.senderId === currentUser?.id;
      return (
        <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text
              style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}
            >
              {item.content}
            </Text>
            <View style={styles.messageInfo}>
              <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextThem]}>
                {new Date(item.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {isMe && (
                <View style={styles.readReceipt}>
                  {item.pending ? (
                    <ActivityIndicator
                      size='small'
                      color={colors.white}
                      style={{ transform: [{ scale: 0.5 }] }}
                    />
                  ) : item.failed ? (
                    <TouchableOpacity
                      onPress={() => handleRetry(item)}
                      style={styles.retryBtn}
                      activeOpacity={0.7}
                    >
                      <AlertTriangle size={12} color={colors.error} />
                      <Text style={styles.retryText}>Réessayer</Text>
                    </TouchableOpacity>
                  ) : item.read ? (
                    <CheckCheck size={14} color={colors.white} />
                  ) : (
                    <Check size={14} color={colors.white} opacity={0.7} />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      );
    },
    [currentUser?.id, handleRetry],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.xs, spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerProfileBtn}
          activeOpacity={0.7}
          onPress={() => {
            if (contactId) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowProfile(true);
            }
          }}
        >
          <Avatar name={contactName || 'Contact'} imageUrl={contactAvatarUrl ?? null} size='sm' />
          <View style={styles.headerInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {contactName}
            </Text>
            {isTyping ? (
              <Text style={styles.typingText}>en train d'écrire...</Text>
            ) : (
              <Text style={styles.viewProfileSubtext}>Appuyer pour voir le profil</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => !isActuallyClosed && contactPhone && call(contactPhone)}
          style={[styles.phoneBtn, isActuallyClosed && styles.phoneBtnDisabled]}
          disabled={isActuallyClosed || !contactPhone}
          activeOpacity={isActuallyClosed ? 1 : 0.7}
        >
          <Phone size={20} color={isActuallyClosed ? colors.textSecondary : colors.primary} />
        </TouchableOpacity>
      </View>

      {isActuallyClosed && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedBannerText}>
            {sos?.status === 'expired'
              ? 'Ce SOS a expiré — conversation archivée'
              : 'Ce SOS est clôturé — conversation archivée'}
          </Text>
        </View>
      )}

      {/* BANNIÈRE D'INFORMATION FIXÉE EN HAUT */}
      <View style={styles.chatInfoBanner}>
        <Lock size={15} color={colors.primary} style={styles.chatInfoIcon} />
        <Text style={styles.chatInfoText}>
          Cette conversation sera automatiquement archivée une fois le don effectué. Vos échanges
          resteront consultables.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
          keyboardShouldPersistTaps='handled'
          keyboardDismissMode='on-drag'
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />
      )}

      {!isActuallyClosed && (
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: isKeyboardVisible ? spacing.sm : Math.max(insets.bottom, spacing.sm),
            },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder='Votre message...'
            value={input}
            onChangeText={handleTextChange}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Send size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL PROFIL PUBLIC */}
      <PublicProfileModal
        visible={showProfile}
        userId={contactId}
        onClose={() => setShowProfile(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs, marginRight: spacing.xs },
  headerProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  headerInfo: { flex: 1 },
  contactName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  viewProfileSubtext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  typingText: { fontFamily: typography.fontFamily.medium, fontSize: 11, color: colors.primary },
  phoneBtn: { padding: spacing.xs },
  closedBanner: { backgroundColor: colors.border, padding: spacing.sm, alignItems: 'center' },
  closedBannerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  listContent: { padding: spacing.md },
  messageRow: { marginBottom: spacing.md, flexDirection: 'row' },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowThem: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: 16 },
  bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  messageText: { fontFamily: typography.fontFamily.regular, fontSize: 15 },
  messageTextMe: { color: colors.white },
  messageTextThem: { color: colors.textPrimary },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: { fontFamily: typography.fontFamily.regular, fontSize: 11 },
  timeTextMe: { color: 'rgba(255,255,255,0.7)' },
  timeTextThem: { color: colors.textSecondary },
  readReceipt: { marginLeft: 4 },
  failedText: { color: colors.error, fontSize: 12 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,59,48,0.15)',
  },
  retryText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.error,
  },
  chatInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    borderLeftWidth: 3.5,
    borderLeftColor: colors.primary,
    gap: 10,
  },
  chatInfoIcon: {
    flexShrink: 0,
  },
  chatInfoText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: '#374151',
    lineHeight: 17,
  },
  phoneBtnDisabled: {
    opacity: 0.4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
    marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: colors.border },
});
