import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReputationModule } from '../reputation/reputation.module';
import { DonorsController } from './donors.controller';
import { DonorsGateway } from './donors.gateway';
import { DonorsService } from './donors.service';

@Module({
  imports: [PrismaModule, NotificationsModule, ReputationModule, EligibilityModule, AuthModule],
  controllers: [DonorsController],
  providers: [DonorsService, DonorsGateway],
  exports: [DonorsService, DonorsGateway],
})
export class DonorsModule {}
