import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ChatService } from './chat.service';

const SendMessageSchema = z.object({
  content: z.string().min(1).max(500),
  contactId: z.string().uuid(),
});

@ApiTags('Messagerie & Chat')
@ApiBearerAuth()
@Controller('sos/:id/messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Consulter les messages échangés dans le cadre d’un SOS' })
  async getMessages(
    @CurrentUser() user: JwtUser,
    @Param('id') sosId: string,
    @Query('contactId') contactId: string,
    @Query('cursor') cursor?: string,
  ) {
    if (!contactId) throw new Error('contactId est requis');
    return this.chatService.getMessages(sosId, user.id, contactId, cursor);
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Envoyer un nouveau message à un contact du SOS' })
  async sendMessage(
    @CurrentUser() user: JwtUser,
    @Param('id') sosId: string,
    @Body(new ZodValidationPipe(SendMessageSchema)) dto: { content: string; contactId: string },
  ) {
    return this.chatService.sendMessage(user.id, sosId, dto.contactId, dto.content);
  }

  @Patch('read')
  @ApiOperation({ summary: 'Accuser réception et marquer les messages reçus comme lus' })
  async markAsRead(
    @CurrentUser() user: JwtUser,
    @Param('id') sosId: string,
    @Body('contactId') contactId: string,
  ) {
    return this.chatService.markAsRead(sosId, user.id, contactId);
  }
}
