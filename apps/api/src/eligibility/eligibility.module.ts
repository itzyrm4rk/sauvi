import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BloodCompatibilityService } from './blood-compatibility.service';
import { EligibilityCron } from './eligibility.cron';
import { EligibilityService } from './eligibility.service';

@Module({
  imports: [PrismaModule, NotificationsModule, ScheduleModule.forRoot()],
  providers: [EligibilityService, BloodCompatibilityService, EligibilityCron],
  exports: [EligibilityService, BloodCompatibilityService],
})
export class EligibilityModule {}
