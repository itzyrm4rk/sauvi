import { BloodChart } from '../components/BloodChart';
import { FeaturesShowcase } from '../components/FeaturesShowcase';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { InstallGuide } from '../components/InstallGuide';

export default function Home() {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', zIndex: 1 }}>
      <Header />
      {/* Hero has id="telechargement" */}
      <Hero />
      {/* FeaturesShowcase has id="showcase" */}
      <FeaturesShowcase />
      {/* InstallGuide has id="installation" */}
      <InstallGuide />
      {/* BloodChart has id="compatibilite" */}
      <BloodChart />
      <Footer />
    </main>
  );
}
