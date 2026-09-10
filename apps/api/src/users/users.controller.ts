import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { type ChangePasswordDto, ChangePasswordSchema } from './dto/change-password.dto';
import { type UpdateFcmTokenDto, UpdateFcmTokenSchema } from './dto/update-fcm-token.dto';
import { type UpdateUserDto, UpdateUserSchema } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Profil Utilisateur & Historique')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtenir les informations du profil connecté' })
  async getMe(@CurrentUser() user: JwtUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Mettre à jour son profil (nom, ville, téléphone, groupe sanguin)' })
  async updateMe(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(UpdateUserSchema)) dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Patch('me/password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Changer son mot de passe' })
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(ChangePasswordSchema)) dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Post('me/avatar')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Téléverser une photo de profil (Avatar)' })
  async uploadAvatar(
    @CurrentUser() user: JwtUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(user.id, file.buffer, file.mimetype);
  }

  @Get('me/eligibility')
  @ApiOperation({ summary: 'Vérifier son statut d’éligibilité biologique au don de sang' })
  async getEligibility(@CurrentUser() user: JwtUser) {
    return this.usersService.getEligibility(user.id);
  }

  @Patch('me/fcm-token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Enregistrer le token de notifications push FCM' })
  async updateFcmToken(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(UpdateFcmTokenSchema)) dto: UpdateFcmTokenDto,
  ) {
    return this.usersService.updateFcmToken(user.id, dto);
  }

  @Post('me/fcm-token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Enregistrer le token de notifications push FCM (alias POST)' })
  async saveFcmToken(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(UpdateFcmTokenSchema)) dto: UpdateFcmTokenDto,
  ) {
    return this.usersService.updateFcmToken(user.id, dto);
  }

  @Get('me/active-donation')
  @ApiOperation({ summary: 'Récupérer le don en cours actuellement' })
  async getActiveDonation(@CurrentUser() user: JwtUser) {
    return this.usersService.getActiveDonation(user.id);
  }

  @Get('me/donation-history')
  @ApiOperation({ summary: 'Consulter l’historique des dons effectués et attestations' })
  async getDonationHistory(@CurrentUser() user: JwtUser) {
    return this.usersService.getDonationHistory(user.id);
  }

  @Get('me/sos-history')
  @ApiOperation({ summary: 'Consulter l’historique des SOS créés par l’utilisateur' })
  async getSosHistory(@CurrentUser() user: JwtUser) {
    return this.usersService.getSosHistory(user.id);
  }

  @Get(':id/public-profile')
  @ApiOperation({ summary: 'Consulter le profil public d’un donneur ou demandeur' })
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Delete('me/notifications')
  @ApiOperation({ summary: 'Désactiver les notifications push (opt-out)' })
  async disableNotifications(@CurrentUser() user: JwtUser) {
    return this.usersService.disableNotifications(user.id);
  }
}
