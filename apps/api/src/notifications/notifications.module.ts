import { Module } from '@nestjs/common';
import { BloodCompatibilityService } from '../eligibility/blood-compatibility.service';
import { PrismaModule } from '../prisma/prisma.module';
import { fcmProvider } from './fcm.provider';
import { FcmService } from './fcm.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [fcmProvider, FcmService, NotificationsService, BloodCompatibilityService],
  exports: [FcmService, NotificationsService],
})
export class NotificationsModule {}
