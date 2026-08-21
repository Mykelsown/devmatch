/**
 * DevMatch — privacy-first developer team-matching on Midnight.
 *
 * App shell: ambient background, pill navbar, hash-routed views, footer, and
 * the wallet connect modal. All state lives in AppContext; the wallet backend
 * (demo or real Lace/Midnight) is resolved behind the clean interface in
 * lib/wallet-backend.ts.
 */
import { useEffect } from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { BackgroundFX } from './components/BackgroundFX';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ConnectModal } from './components/wallet/ConnectModal';
import { Hero } from './components/landing/Hero';
import { MatchTickets } from './components/landing/MatchTickets';
import { HowItWorks } from './components/landing/HowItWorks';
import { TrustTiers } from './components/landing/TrustTiers';
import { RegisterFlow } from './components/register/RegisterFlow';
import { Dashboard } from './components/dashboard/Dashboard';
import { MatchDetail } from './components/match/MatchDetail';

function LandingPage() {
  return (
    <>
      <Hero />
      <MatchTickets />
      <HowItWorks />
      <TrustTiers />
    </>
  );
}

function Shell() {
  const { route } = useApp();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  const isDashboard = route.view === 'dashboard';

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <BackgroundFX />
      {!isDashboard && <Navbar />}
      <main className="relative z-10">
        {route.view === 'landing' && <LandingPage />}
        {route.view === 'dashboard' && <Dashboard />}
        {route.view === 'register' && <RegisterFlow />}
        {route.view === 'match' && <MatchDetail id={route.id} />}
      </main>
      {!isDashboard && <Footer />}
      <ConnectModal />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
