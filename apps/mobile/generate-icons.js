const { generateImageAsync } = require('@expo/image-utils');
const path = require('node:path');
const fs = require('node:fs');

/**
 * Script utilitaire one-shot — génère les assets d'icônes Android/iOS.
 * Exécuter : node generate-icons.js
 */
async function createAdaptiveIcon() {
  const logoPath = path.resolve(__dirname, 'assets/images/logo.png');
  const outputPath = path.resolve(__dirname, 'assets/adaptive-icon.png');
  const iconPath = path.resolve(__dirname, 'assets/icon.png');
  const splashPath = path.resolve(__dirname, 'assets/splash-icon.png');

  process.stdout.write('Generating adaptive-icon.png (1024x1024 with safe zone)...\n');

  // Icône adaptative Android : logo centré dans la zone safe (66% central)
  const result = await generateImageAsync(
    { projectRoot: __dirname, cacheType: 'adaptive-icon' },
    {
      src: logoPath,
      width: 1024,
      height: 1024,
      resizeMode: 'contain',
      backgroundColor: 'transparent',
      borderRadius: 0,
    },
  );
  fs.writeFileSync(outputPath, result.source);
  process.stdout.write(`Saved: ${outputPath} (${result.source.length} bytes)\n`);

  // Icône principale (iOS et launcher Android standard) — fond blanc
  const iconResult = await generateImageAsync(
    { projectRoot: __dirname, cacheType: 'app-icon' },
    {
      src: logoPath,
      width: 1024,
      height: 1024,
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
      borderRadius: 0,
    },
  );
  fs.writeFileSync(iconPath, iconResult.source);
  process.stdout.write(`Saved: ${iconPath}\n`);

  // Icône splash screen
  const splashResult = await generateImageAsync(
    { projectRoot: __dirname, cacheType: 'splash-icon' },
    {
      src: logoPath,
      width: 512,
      height: 512,
      resizeMode: 'contain',
      backgroundColor: 'transparent',
      borderRadius: 0,
    },
  );
  fs.writeFileSync(splashPath, splashResult.source);
  process.stdout.write(`Saved: ${splashPath}\n`);
}

createAdaptiveIcon().catch((err) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
