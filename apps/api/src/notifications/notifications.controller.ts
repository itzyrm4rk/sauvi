import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les notifications In-App reçues par l’utilisateur' })
  async getMyNotifications(
    @CurrentUser() user: JwtUser,
  ): Promise<ReturnType<NotificationsService['getForUser']>> {
    return this.notificationsService.getForUser(user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications de l’utilisateur comme lues' })
  async markAllRead(
    @CurrentUser() user: JwtUser,
  ): Promise<ReturnType<NotificationsService['markAllRead']>> {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification individuelle comme lue' })
  async markOneRead(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ): Promise<ReturnType<NotificationsService['markOneRead']>> {
    return this.notificationsService.markOneRead(user.id, id);
  }
}
