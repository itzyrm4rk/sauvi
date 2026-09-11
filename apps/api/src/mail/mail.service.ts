import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Env } from '../config/env.validation';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null = null;
  private readonly fromEmail: string;
  private readonly fromName = 'SAUVI';
  private readonly isDevMode: boolean;

  constructor(private readonly configService: ConfigService<Env, true>) {
    const provider = this.configService.get('MAIL_PROVIDER', { infer: true }) ?? 'dev';
    this.fromEmail = this.configService.get('FROM_EMAIL', { infer: true });

    // Mode développement : log uniquement, aucun envoi réel
    if (provider === 'dev' || !provider) {
      this.isDevMode = true;
      this.logger.warn('[MailService] Mode dev — les emails sont loggés mais non envoyés.');
      return;
    }

    this.isDevMode = false;

    if (provider === 'gmail') {
      // Gmail SMTP via App Password Google (gratuit, 500 emails/jour)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.get('GMAIL_USER', { infer: true }),
          pass: this.configService.get('GMAIL_APP_PASSWORD', { infer: true }),
        },
      });
    } else if (provider === 'brevo') {
      // Brevo SMTP (ex-Sendinblue, gratuit 300 emails/jour)
      this.transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: this.configService.get('BREVO_SMTP_USER', { infer: true }),
          pass: this.configService.get('BREVO_SMTP_KEY', { infer: true }),
        },
      });
    } else if (provider === 'resend') {
      // Resend SMTP relay (domaine vérifié requis en prod, onboarding@resend.dev en dev)
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: this.configService.get('RESEND_API_KEY', { infer: true }),
        },
      });
    } else {
      this.logger.warn(`[MailService] Fournisseur inconnu : ${provider}. Mode dev activé.`);
      this.isDevMode = true;
    }
  }

  /**
   * Envoie un email transactionnel multi-part (HTML + texte brut).
   * Compatible Gmail SMTP, Brevo SMTP, et Resend SMTP.
   */
  async sendMail(options: SendMailOptions): Promise<boolean> {
    if (this.isDevMode || !this.transporter) {
      this.logger.log(
        `[Mail Dev] ✉️  À: ${options.to} | Sujet: "${options.subject}"\n${options.text}`,
      );
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        headers: {
          'X-Priority': '1',
          Importance: 'high',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
      });

      this.logger.log(`[MailService] ✅ Email envoyé à ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`[MailService] ❌ Échec envoi à ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Envoie l'email contenant le code OTP de réinitialisation de mot de passe.
   */
  async sendPasswordResetOtp(to: string, otp: string, userName?: string): Promise<boolean> {
    const name = userName ? ` ${userName}` : '';
    const subject = 'SAUVI — Code de réinitialisation de votre mot de passe';

    const text = `Hello${name},\n\nVous avez demandé la réinitialisation de votre mot de passe sur l'application SAUVI.\n\nVotre code de confirmation est : ${otp}\n\nCe code est valide pendant 15 minutes.\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nL'équipe SAUVI`;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
          <tr>
            <td style="background-color: #E24B4A; padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: 1px;">SAUVI</h1>
              <p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 13px;">Don de sang d'urgence</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #0F172A; font-weight: 600;">Réinitialisation de mot de passe</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #475569;">
                Bonjour${name},<br>
                Une demande de réinitialisation de mot de passe a été initiée pour votre compte SAUVI. Voici votre code de vérification :
              </p>
              <div style="background-color: #F1F5F9; border: 2px dashed #CBD5E1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #E24B4A; display: inline-block;">
                  ${otp}
                </span>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748B;">
                  ⏱️ Ce code expire dans <strong>15 minutes</strong>.
                </p>
              </div>
              <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 4px; padding: 12px 16px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #991B1B;">
                  <strong>Sécurité :</strong> Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe actuel reste inchangé.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F8FAFC; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                © ${new Date().getFullYear()} SAUVI · Don de sang solidaire au Cameroun
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    return this.sendMail({ to, subject, text, html });
  }
}
