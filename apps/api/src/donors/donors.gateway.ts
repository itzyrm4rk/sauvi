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

@WebSocketGateway({ cors: true, namespace: '/sos' })
export class DonorsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(DonorsGateway.name);

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

    // Attach user payload to the client data for later use
    client.data.user = payload;
    this.logger.log(`Client connecté au namespace /sos: ${client.id} (User: ${payload.sub})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté du namespace /sos: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() sosId: string) {
    client.join(`sos:${sosId}`);
    this.logger.log(`Client ${client.id} a rejoint la room sos:${sosId}`);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() sosId: string) {
    client.leave(`sos:${sosId}`);
    this.logger.log(`Client ${client.id} a quitté la room sos:${sosId}`);
  }

  emitWaitlistUpdate(sosId: string, waitlist: unknown[]) {
    this.server.to(`sos:${sosId}`).emit('waitlist:update', { sosId, waitlist });
  }

  emitSosClosed(sosId: string) {
    if (!this.server) return;
    this.server.to(`sos:${sosId}`).emit('sos:closed', { sosId });
    this.server.emit('sos:closed', { sosId }); // Broadcast global pour Explorer & HomeScreen
  }

  emitSosExpired(sosId: string) {
    if (!this.server) return;
    this.server.to(`sos:${sosId}`).emit('sos:expired', { sosId });
    this.server.emit('sos:expired', { sosId }); // Broadcast global pour Explorer & HomeScreen
  }

  emitDonorJoined(sosId: string, donor: unknown) {
    if (!this.server) return;
    this.server.to(`sos:${sosId}`).emit('sos:donor_joined', { sosId, donor });
  }
}
