'use client';

export function InstallGuide() {
  return (
    <section className='steps-section' id='installation'>
      <div className='section-tag'>Guide d'installation</div>
      <h2 className='section-title'>Installer SAUVI sur votre téléphone en 3 étapes</h2>

      <div className='steps-grid'>
        <div className='step-box'>
          <div className='step-num-badge'>1</div>
          <h3>Téléchargez le fichier APK</h3>
          <p>
            Appuyez sur le bouton <strong>« Télécharger l'APK »</strong> en haut de cette page
            depuis votre navigateur mobile Android (Chrome, Firefox, etc.).
          </p>
        </div>

        <div className='step-box'>
          <div className='step-num-badge'>2</div>
          <h3>Autorisez l'installation</h3>
          <p>
            Si Android affiche l'avertissement de sécurité standard{' '}
            <em>« Fichier potentiellement dangereux »</em>, sélectionnez{' '}
            <strong>Télécharger quand même</strong> puis activez{' '}
            <strong>« Autoriser cette source »</strong>.
          </p>
        </div>

        <div className='step-box'>
          <div className='step-num-badge'>3</div>
          <h3>Ouvrez & sauvez des vies</h3>
          <p>
            Cliquez sur <strong>Installer</strong>. Ouvrez SAUVI, créez votre profil donneur avec
            votre groupe sanguin et activez la localisation pour recevoir les alertes proches.
          </p>
        </div>
      </div>
    </section>
  );
}
