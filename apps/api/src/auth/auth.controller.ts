import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { Env } from '../config/env.validation';
import { AuthService } from './auth.service';
import { type ForgotPasswordDto, ForgotPasswordSchema } from './dto/forgot-password.dto';
import { type LoginDto, LoginSchema } from './dto/login.dto';
import { type RegisterStep1Dto, RegisterStep1Schema } from './dto/register-step1.dto';
import { type RegisterStep2Dto, RegisterStep2Schema } from './dto/register-step2.dto';
import { type ResetPasswordDto, ResetPasswordSchema } from './dto/reset-password.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { GoogleProfile } from './strategies/google.strategy';
import type { JwtRefreshUser } from './strategies/jwt-refresh.strategy';
import type { JwtUser } from './strategies/jwt.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  /**
   * POST /auth/register/step1
   * Inscription étape 1 : nom, email, mot de passe.
   */
  @Public()
  @Post('register/step1')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inscription étape 1 — identifiants' })
  async registerStep1(
    @Body(new ZodValidationPipe(RegisterStep1Schema)) dto: RegisterStep1Dto,
  ): Promise<ReturnType<AuthService['registerStep1']>> {
    return this.authService.registerStep1(dto);
  }

  /**
   * POST /auth/register/step2
   * Inscription étape 2 : profil médical (nécessite JWT).
   */
  @Post('register/step2')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inscription étape 2 — profil médical' })
  async registerStep2(
    @Body(new ZodValidationPipe(RegisterStep2Schema)) dto: RegisterStep2Dto,
    @CurrentUser() user: JwtUser,
  ): Promise<ReturnType<AuthService['registerStep2']>> {
    return this.authService.registerStep2(user.id, dto);
  }

  /**
   * POST /auth/login
   * Connexion par email/mot de passe.
   */
  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion email/mot de passe' })
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
  ): Promise<ReturnType<AuthService['login']>> {
    return this.authService.login(dto);
  }

  /**
   * GET /auth/google
   * Initie le flux Google OAuth 2.0.
   */
  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Initier le flux Google OAuth' })
  googleAuth(): void {
    // Le guard redirige vers Google
  }

  /**
   * GET /auth/google/callback
   * Callback Google OAuth — redirige vers le frontend avec les tokens.
   */
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Callback Google OAuth' })
  async googleCallback(
    @CurrentUser() googleProfile: GoogleProfile,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.validateGoogleUser(googleProfile);
    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });

    const params = new URLSearchParams({
      accessToken: result.data.tokens.accessToken,
      refreshToken: result.data.tokens.refreshToken,
      profileComplete: String(result.data.profileComplete),
      email: result.data.user.email,
      name: result.data.user.name,
    });

    const stateUrl = typeof req.query.state === 'string' ? req.query.state : null;
    let redirectUrl: string;

    if (stateUrl) {
      const separator = stateUrl.includes('?') ? '&' : '?';
      redirectUrl = `${stateUrl}${separator}${params.toString()}`;
    } else {
      redirectUrl = `${frontendUrl}/auth/callback?${params.toString()}`;
    }

    res.redirect(redirectUrl);
  }

  /**
   * POST /auth/refresh
   * Rafraîchit la paire de tokens JWT.
   */
  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: { limit: 10, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir les tokens JWT' })
  async refreshTokens(
    @CurrentUser() user: JwtRefreshUser,
  ): Promise<ReturnType<AuthService['refreshTokens']>> {
    return this.authService.refreshTokens(user.id, user.refreshToken);
  }

  /**
   * POST /auth/logout
   * Déconnexion — invalide le refresh token.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déconnexion' })
  async logout(@CurrentUser() user: JwtUser): Promise<ReturnType<AuthService['logout']>> {
    return this.authService.logout(user.id);
  }

  /**
   * POST /auth/forgot-password
   * Envoie un email de réinitialisation de mot de passe.
   */
  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mot de passe oublié' })
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordSchema)) dto: ForgotPasswordDto,
  ): Promise<ReturnType<AuthService['forgotPassword']>> {
    return this.authService.forgotPassword(dto);
  }

  /**
   * POST /auth/reset-password
   * Réinitialise le mot de passe avec un token.
   */
  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe' })
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordSchema)) dto: ResetPasswordDto,
  ): Promise<ReturnType<AuthService['resetPassword']>> {
    return this.authService.resetPassword(dto);
  }
}
