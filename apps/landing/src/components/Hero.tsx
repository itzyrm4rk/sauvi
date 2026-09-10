'use client';

import {
  AlertCircleIcon,
  ClockIcon,
  DownloadIcon,
  DropletsIcon,
  ShieldCheckIcon,
} from './Icons';

export function Hero() {
  const apkDownloadUrl = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || '/downloads/sauvi-latest.apk';

  return (
    <section className='hero-section' id='telechargement'>
      <div className='hero-grid'>
        {/* COLONNE GAUCHE : TEXTE & ACTIONS */}
        <div className='hero-left'>
          <div className='hero-badge-pill'>
            <DropletsIcon size={16} />
            <span>Urgence Vitale & Don de Sang Collaboratif</span>
          </div>

          <h1 className='hero-title'>
            Sauver des Vies
            <br />
            Devient <span>Simple & Immédiat</span>
          </h1>

          <p className='hero-desc'>
            SAUVI mobilise en temps réel les donneurs de sang compatibles & éligibles les plus
            proches lors des urgences médicales dans votre ville. Chaque seconde compte pour sauver
            un être cher.
          </p>

          <div className='store-buttons-group'>
            {/* BOUTON TÉLÉCHARGEMENT DIRECT DE L'APK */}
            <div className='primary-download-row'>
              <a href={apkDownloadUrl} className='btn-apk-main' download='sauvi-latest.apk'>
                <DownloadIcon size={24} color='#FFFFFF' />
                <div className='btn-apk-info'>
                  <span>Télécharger l'APK Android</span>
                  <span className='btn-apk-subtext'>
                    Version 1.0.0 • Gratuit & Sécurisé (~120 Mo)
                  </span>
                </div>
              </a>
            </div>

            {/* BADGES GOOGLE PLAY & APP STORE */}
            <div className='store-badges-row'>
              {/* Google Play (Bientôt) */}
              <div
                className='store-badge-card'
                title='En cours de validation finale sur Google Play'
              >
                <span className='badge-soon-pill'>Bientôt disponible</span>
                <svg
                  width='22'
                  height='22'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  aria-hidden='true'
                >
                  <path d='M3.609 1.814L13.792 12 3.61 22.186a2.43 2.43 0 0 1-.22-.387 2.45 2.45 0 0 1-.14-.814V2.999c0-.287.05-.563.14-.813.06-.14.135-.27.219-.372zM15.207 13.414l2.58 2.58-12.87 7.43a2.3 2.3 0 0 1-.726.237l11.016-10.247zm0-2.828L4.191.339c.234.05.47.13.726.237l12.87 7.43-2.58 2.58zM16.621 12l2.368-1.367 3.516 2.03a1.5 1.5 0 0 1 0 2.674l-3.516 2.03L16.621 12z' />
                </svg>
                <div className='store-badge-texts'>
                  <span className='store-badge-small'>Disponible bientôt sur</span>
                  <span className='store-badge-bold'>Google Play</span>
                </div>
              </div>

              {/* App Store (iOS en cours) */}
              <div className='store-badge-card' title='Version iOS en cours de préparation'>
                <span className='badge-soon-pill'>Bientôt sur iOS</span>
                <svg
                  width='22'
                  height='22'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  aria-hidden='true'
                >
                  <path d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-.99 1.74-.86 2.76 1.01.08 2.03-.51 2.59-1.26z' />
                </svg>
                <div className='store-badge-texts'>
                  <span className='store-badge-small'>En développement</span>
                  <span className='store-badge-bold'>App Store</span>
                </div>
              </div>
            </div>
          </div>

          <p className='apk-notice-text'>
            <AlertCircleIcon size={16} color='#E24B4A' />
            <span>
              En attendant la parution Play Store, installez l'APK certifié directement sur Android
              en toute sécurité.
            </span>
          </p>
        </div>

        {/* COLONNE DROITE : SMARTPHONE MOCKUP AVEC ÉLÉMENTS FLOTTANTS */}
        <div className='phone-mockup-wrapper'>
          <div className='mockup-backdrop-pattern' />

          {/* CARTE FLOTTANTE 1 : TEMPS DE RÉPONSE SOS */}
          <div className='floating-card-stat'>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ClockIcon size={16} color='#E24B4A' />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                Alerte SOS
              </span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#E24B4A' }}>&lt; 15 min</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
              Pour trouver un donneur proche
            </div>
          </div>

          {/* PHONE CONTAINER */}
          <div className='phone-frame'>
            <div className='phone-inner-screen'>
              <div className='phone-notch' />
              <img
                src='/images/app-screenshot.jpg'
                alt='Capture écran SAUVI — Recherche de sang'
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top',
                  borderRadius: '0 0 36px 36px',
                  display: 'block',
                }}
              />
            </div>
          </div>

          {/* CARTE FLOTTANTE 2 : SÉCURITÉ MÉDICALE */}
          <div className='floating-card-badge'>
            <ShieldCheckIcon size={26} color='#34D399' />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>100% Sécurisé</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Données médicales chiffrées</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
