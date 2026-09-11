import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import type { Env } from '../config/env.validation';

const BUCKET_NAME = 'avatars';

/**
 * Service pour l'upload de fichiers vers Supabase Storage (bucket "avatars").
 * Aucune transformation côté serveur — les transformations (resize, qualité)
 * sont appliquées à la lecture via les paramètres URL CDN de Supabase
 * ex: ?width=200&quality=80
 */
@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService<Env, true>) {
    const supabaseUrl = this.configService.get('SUPABASE_URL', { infer: true });
    const serviceRoleKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true });

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        // Pas de session persistante pour un usage serveur
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Upload un buffer de fichier dans le bucket Supabase Storage "avatars".
   * @param buffer    - Buffer du fichier image
   * @param key       - Clé de destination (ex: "avatars/userId-timestamp.jpg")
   * @param mimeType  - Type MIME du fichier (ex: "image/jpeg")
   * @returns L'URL publique CDN Supabase du fichier uploadé
   */
  async uploadBuffer(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    const { error } = await this.supabase.storage.from(BUCKET_NAME).upload(key, buffer, {
      contentType: mimeType,
      upsert: true, // Écrase si le fichier existe déjà (cas d'un re-upload d'avatar)
    });

    if (error) {
      this.logger.error(`Erreur upload Supabase Storage [${key}]: ${error.message}`);
      throw new InternalServerErrorException("Erreur lors de l'upload de l'image");
    }

    const { data } = this.supabase.storage.from(BUCKET_NAME).getPublicUrl(key);

    this.logger.log(`Avatar uploadé avec succès: ${data.publicUrl}`);
    return data.publicUrl;
  }
}
