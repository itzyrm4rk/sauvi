import { Module } from '@nestjs/common';
import { DonorsModule } from '../donors/donors.module';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SosController } from './sos.controller';
import { SosService } from './sos.service';

@Module({
  imports: [PrismaModule, NotificationsModule, EligibilityModule, DonorsModule],
  controllers: [SosController],
  providers: [SosService],
  exports: [SosService],
})
export class SosModule {}
