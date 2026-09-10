import { Module } from '@nestjs/common';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { StorageModule } from '../storage/storage.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [EligibilityModule, StorageModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
