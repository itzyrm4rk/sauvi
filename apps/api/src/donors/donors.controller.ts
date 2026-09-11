import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { DonorsService } from './donors.service';
import { type JoinWaitlistDto, JoinWaitlistSchema } from './dto/join-waitlist.dto';
import { type UpdateWaitlistDto, UpdateWaitlistSchema } from './dto/update-waitlist.dto';

@ApiTags('Donneurs & File d’attente')
@ApiBearerAuth()
@Controller('sos/:id/waitlist')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Rejoindre la file d’attente d’un SOS en tant que donneur' })
  async joinWaitlist(
    @CurrentUser() user: JwtUser,
    @Param('id') sosId: string,
    @Body(new ZodValidationPipe(JoinWaitlistSchema)) dto: JoinWaitlistDto,
  ) {
    return this.donorsService.join(user.id, sosId, dto);
  }

  @Delete()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Se désister et annuler sa participation à la file d’attente' })
  async cancelWaitlist(@CurrentUser() user: JwtUser, @Param('id') sosId: string) {
    return this.donorsService.cancel(user.id, sosId);
  }

  @Patch(':donorId')
  @ApiOperation({ summary: 'Valider un donneur ou confirmer son don (demandeur uniquement)' })
  async updateStatus(
    @CurrentUser() user: JwtUser,
    @Param('id') sosId: string,
    @Param('donorId') donorId: string,
    @Body(new ZodValidationPipe(UpdateWaitlistSchema)) dto: UpdateWaitlistDto,
  ) {
    return this.donorsService.updateStatus(user.id, sosId, donorId, dto.status);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtenir mon statut dans la file d’attente d’un SOS' })
  async getMyEntry(@CurrentUser() user: JwtUser, @Param('id') sosId: string) {
    return this.donorsService.getMyWaitlistEntry(sosId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Consulter la file d’attente complète des donneurs pour un SOS' })
  async getWaitlist(@CurrentUser() user: JwtUser, @Param('id') sosId: string) {
    return this.donorsService.getWaitlist(sosId, user.id);
  }
}
