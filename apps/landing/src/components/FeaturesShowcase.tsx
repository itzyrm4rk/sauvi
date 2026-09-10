'use client';

import {
  AwardIcon,
  BellRingIcon,
  CompassIcon,
  DropletsIcon,
  MessageSquareIcon,
  Share2Icon,
} from './Icons';

export function FeaturesShowcase() {
  return (
    <section className='showcase-section' id='showcase'>
      <h2 className='showcase-heading'>
        Vous avez le pouvoir d'agir.
        <br />
        Qu'attendez-vous pour <span>sauver une vie</span> ?
      </h2>

      <div className='showcase-center-stage'>
        <div className='showcase-circle-bg' />

        {/* CARTE FLOTTANTE 1 : HAUT-GAUCHE */}
        <div className='feature-card-floating feat-pos-top-left'>
          <div className='feat-icon-box' style={{ background: '#FEE2E2', color: '#E24B4A' }}>
            <BellRingIcon size={22} color='#E24B4A' />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
              Alertes SOS Directes
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
              Notification push ciblée par rayon kilométrique
            </div>
          </div>
        </div>

        {/* CARTE FLOTTANTE 2 : MILIEU-GAUCHE (NOUVEAU : FLYER SOS) */}
        <div className='feature-card-floating feat-pos-mid-left'>
          <div className='feat-icon-box' style={{ background: '#FFF1F2', color: '#BE123C' }}>
            <Share2Icon size={22} color='#BE123C' />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
              Flyer SOS & Partager
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
              Génération d'affiche SOS & partage sur les réseaux sociaux
            </div>
          </div>
        </div>

        {/* CARTE FLOTTANTE 3 : BAS-GAUCHE */}
        <div className='feature-card-floating feat-pos-bottom-left'>
          <div className='feat-icon-box' style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <CompassIcon size={22} color='#2563EB' />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
              Navigation Hôpital
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
              Itinéraire GPS direct et suivi d'arrivée
            </div>
          </div>
        </div>

        {/* SMARTPHONE CENTRAL DU SHOWCASE */}
        <div className='showcase-phone'>
          <div className='phone-inner-screen'>
            <div className='phone-notch' />
            <img
              src='/images/app-screenshot1.jpg'
              alt='Capture écran SAUVI — Recherche de sang'
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top',
                borderRadius: '0 0 28px 28px',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* CARTE FLOTTANTE 4 : HAUT-DROITE */}
        <div className='feature-card-floating feat-pos-top-right'>
          <div className='feat-icon-box' style={{ background: '#EDE9FE', color: '#7C3AED' }}>
            <DropletsIcon size={22} color='#7C3AED' />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
              Compatibilité Médicale
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
              Filtrage par compatibilité ABO/Rhésus
            </div>
          </div>
        </div>

        {/* CARTE FLOTTANTE 5 : MILIEU-DROITE (NOUVEAU : BADGES & RÉPUTATION) */}
        <div className='feature-card-floating feat-pos-mid-right'>
          <div className='feat-icon-box' style={{ background: '#FEF3C7', color: '#D97706' }}>
            <AwardIcon size={22} color='#D97706' />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
              Badges & Réputation
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
              Points donneur & paliers de bravoure
            </div>
          </div>
        </div>

        {/* CARTE FLOTTANTE 6 : BAS-DROITE */}
        <div className='feature-card-floating feat-pos-bottom-right'>
          <div className='feat-icon-box' style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <MessageSquareIcon size={22} color='#16A34A' />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
              Coordination & Chat
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
              Échanges sécurisés avec les concernés
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
