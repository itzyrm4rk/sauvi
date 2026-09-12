import Link from 'next/link';
import { APK_DOWNLOAD_URL } from '../../../constants/links';

interface SosSharePageProps {
  params: { id: string };
}

export default function SosSharePage({ params }: SosSharePageProps) {
  const { id } = params;
  const deepLink = `sauvi://sos/${id}`;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0B0F19',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(226, 75, 74, 0.25)',
          borderRadius: '20px',
          padding: '32px 24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(226, 75, 74, 0.15)',
            border: '1px solid rgba(226, 75, 74, 0.4)',
            color: '#E24B4A',
            borderRadius: '999px',
            padding: '6px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '20px',
          }}
        >
          🚨 URGENCE VITALE — APPEL AU DON
        </div>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            marginBottom: '12px',
            color: '#FFFFFF',
            lineHeight: 1.3,
          }}
        >
          Un patient a besoin d'un don de sang urgent
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#94A3B8',
            lineHeight: 1.6,
            marginBottom: '28px',
          }}
        >
          Ce SOS a été diffusé via la plateforme <strong>SAUVI</strong>. Si vous êtes compatible ou
          si vous souhaitez relayer l'appel, ouvrez l'alerte dans l'application ou téléchargez SAUVI
          gratuitement.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Bouton pour ceux qui ont déjà l'application */}
          <a
            href={deepLink}
            style={{
              background: 'linear-gradient(135deg, #E24B4A 0%, #B91C1C 100%)',
              color: '#FFFFFF',
              textDecoration: 'none',
              padding: '14px 20px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(226, 75, 74, 0.35)',
            }}
          >
            <span>Ouvrir dans l'application SAUVI</span>
            <span>→</span>
          </a>

          {/* Bouton de téléchargement direct de l'APK */}
          <a
            href={APK_DOWNLOAD_URL}
            download='sauvi.apk'
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#F8FAFC',
              textDecoration: 'none',
              padding: '14px 20px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <span>📥 Télécharger l'APK Android (Gratuit)</span>
          </a>
        </div>

        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Link
            href='/'
            style={{
              color: '#94A3B8',
              textDecoration: 'none',
              fontSize: '0.85rem',
            }}
          >
            ← En savoir plus sur SAUVI
          </Link>
        </div>
      </div>
    </main>
  );
}
