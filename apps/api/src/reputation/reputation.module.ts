import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReputationService } from './reputation.service';

@Module({
  imports: [NotificationsModule],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
