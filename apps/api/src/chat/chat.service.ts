import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { WaitlistStatus } from '@prisma/client';
import { FcmService } from '../notifications/fcm.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly chatGateway: ChatGateway,
    private readonly fcmService: FcmService,
  ) {}

  async sendMessage(senderId: string, sosId: string, receiverId: string, content: string) {
    // Vérifier l'accès (le sender doit être le requester OU un donneur validé)
    const sos = await this.prisma.sosAlert.findUnique({
      where: { id: sosId },
    });

    if (!sos) throw new NotFoundException('SOS introuvable');

    if (sos.requesterId !== senderId) {
      // Si ce n'est pas la famille, ça doit être un donneur validé
      const entry = await this.prisma.donorWaitlist.findUnique({
        where: { sosId_donorId: { sosId, donorId: senderId } },
      });
      if (
        !entry ||
        (entry.status !== WaitlistStatus.validated && entry.status !== WaitlistStatus.donated)
      ) {
        throw new ForbiddenException('Vous devez être validé pour envoyer un message');
      }
    }

    const message = await this.prisma.message.create({
      data: {
        sosId,
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true, phone: true } },
      },
    });

    const roomId = [senderId, receiverId].sort().join('_');
    this.chatGateway.emitNewMessage(sosId, roomId, message);

    // Mute intelligent : Si le destinataire est déjà actif dans la room de chat WebSocket,
    // on ne lui envoie pas de notification push FCM pour ne pas faire vibrer son téléphone inutilement.
    const isReceiverInRoom = this.chatGateway.isUserInChatRoom(sosId, roomId, receiverId);

    if (!isReceiverInRoom) {
      const receiver = await this.prisma.user.findUnique({
        where: { id: receiverId },
        select: { fcmToken: true },
      });
      if (receiver?.fcmToken) {
        const senderName = message.sender?.name || 'Nouveau message';
        const senderPhone = message.sender?.phone || '';
        const preview = content.length > 80 ? `${content.substring(0, 77)}...` : content;
        await this.fcmService.sendToDevice(receiver.fcmToken, {
          title: `Message de ${senderName}`,
          body: preview,
          channelId: 'sauvi-chat-channel',
          data: {
            type: 'chat_message',
            sosId,
            senderId,
            contactName: senderName,
            contactPhone: senderPhone,
          },
        });
      }
    }

    return { data: message };
  }

  async getMessages(sosId: string, userId: string, contactId: string, cursor?: string, limit = 30) {
    const sos = await this.prisma.sosAlert.findUnique({ where: { id: sosId } });
    if (!sos) throw new NotFoundException('SOS introuvable');

    if (sos.requesterId !== userId) {
      const entry = await this.prisma.donorWaitlist.findUnique({
        where: { sosId_donorId: { sosId, donorId: userId } },
      });
      if (
        !entry ||
        (entry.status !== WaitlistStatus.validated && entry.status !== WaitlistStatus.donated)
      ) {
        throw new ForbiddenException('Vous devez être validé pour voir le chat');
      }
    }

    const messages = await this.prisma.message.findMany({
      where: {
        sosId,
        OR: [
          { senderId: userId, receiverId: contactId },
          { senderId: contactId, receiverId: userId },
        ],
      },
      take: limit,
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return { data: messages };
  }

  async markAsRead(sosId: string, userId: string, contactId: string) {
    // Marque comme lus tous les messages envoyés par contactId à userId
    await this.prisma.message.updateMany({
      where: {
        sosId,
        senderId: contactId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });

    // On peut émettre un ACK pour mettre à jour les double-check sur le client
    const roomId = [userId, contactId].sort().join('_');
    this.chatGateway.emitReadAck(sosId, roomId, userId);

    return { success: true };
  }
}
