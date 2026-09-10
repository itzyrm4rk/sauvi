'use client';

import { WhatsappIcon } from './Icons';

export function Footer() {
  return (
    <footer className='footer' id='contact'>
      <div className='footer-container'>
        <div className='footer-top'>
          <div className='footer-brand'>
            <div className='footer-logo'>
              <img
                src='/images/logo1.png'
                alt='SAUVI'
                width={32}
                height={32}
                style={{ objectFit: 'contain', borderRadius: '8px' }}
              />
              <span>SAUVI</span>
            </div>
            <p style={{ lineHeight: '1.6', fontSize: '0.9rem', color: '#94A3B8' }}>
              Connecter les donneurs de sang compatibles avec les patients en situation d'urgence
              vitale au Cameroun.
            </p>
          </div>

          <div className='footer-links-group'>
            <div className='footer-col'>
              <h4>Navigation</h4>
              <ul>
                <li>
                  <a href='#telechargement'>Télécharger l'APK</a>
                </li>
                <li>
                  <a href='#showcase'>Fonctionnalités</a>
                </li>
                <li>
                  <a href='#installation'>Guide d'installation</a>
                </li>
                <li>
                  <a href='#compatibilite'>Compatibilité sanguine</a>
                </li>
              </ul>
            </div>

            <div className='footer-col'>
              <h4>Disponibilité</h4>
              <ul>
                <li>
                  <span style={{ color: '#E24B4A', fontWeight: 600 }}>
                    ● APK Android Direct (Actif)
                  </span>
                </li>
                <li>
                  <span style={{ color: '#64748B' }}>○ Google Play Store (Bientôt)</span>
                </li>
                <li>
                  <span style={{ color: '#64748B' }}>○ Apple App Store (En cours)</span>
                </li>
              </ul>
            </div>

            <div className='footer-col'>
              <h4>Support & Contact</h4>
              <ul>
                <li>
                  <a
                    href='https://wa.me/237697200343'
                    target='_blank'
                    rel='noopener noreferrer'
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#25D366',
                      fontWeight: 700,
                    }}
                  >
                    <WhatsappIcon size={18} color='#25D366' />
                    <span>WhatsApp : 697 20 03 43</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className='footer-bottom'>
          <div>© 2026 SAUVI. Tous droits réservés.</div>
          <div>
            Conçu & développé avec dévouement par{' '}
            <span className='footer-author-highlight'>Marc Didier</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
