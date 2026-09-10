import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { databaseConfig } from './config/database.config';
import { validateEnv } from './config/env.validation';
import { redisConfig } from './config/redis.config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

import { ChatModule } from './chat/chat.module';
import { DonorsModule } from './donors/donors.module';
import { EligibilityModule } from './eligibility/eligibility.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReputationModule } from './reputation/reputation.module';
import { SosModule } from './sos/sos.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [databaseConfig, redisConfig],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000,
            limit: 60,
          },
        ],
        storage: new ThrottlerStorageRedisService(
          configService.get<string>('redis.REDIS_URL') ?? 'redis://localhost:6379',
        ),
      }),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    ChatModule,
    DonorsModule,
    EligibilityModule,
    MailModule,
    NotificationsModule,
    ReputationModule,
    SosModule,
    StorageModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
