/**
 * DevMatch — privacy-first developer matching on Midnight.
 *
 * Level 2 flow: connect Lace -> register a Yellow-tier profile commitment.
 * A GitHub OAuth attestation button (Level 3 prep) redirects to the attester
 * service and stores the returned `attestedProfileHash` client-side.
 */
import { useEffect, useState } from 'react';
import { useMidnight } from './hooks/useMidnight';
import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';
import { ATTESTER_URL, NETWORK_ID } from './config';

const ATTESTED_STORAGE_KEY = 'devmatch:attestedProfileHash';

export function App() {
  const { status, connect, disconnect, registerProfile } = useMidnight();
  const [attested, setAttested] = useState<string | null>(() =>
    localStorage.getItem(ATTESTED_STORAGE_KEY),
  );
  // If the attester redirects back with ?attestedProfileHash=..., store it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = params.get('attestedProfileHash');
    if (hash) {
      localStorage.setItem(ATTESTED_STORAGE_KEY, hash);
      setAttested(hash);
      // Clean the URL so a refresh doesn't re-trigger.
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const connected = status.kind === 'connected';

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <span className="badge">Midnight Builder Challenge · Level 2</span>
          <h1>
            DevMatch<span className="accent">.</span>
          </h1>
          <p className="tagline">
            Prove you&apos;re the right developer for a project — without
            revealing your stack, experience, or availability.
          </p>
          <div className="hero-steps">
            <span>1 · Connect Lace</span>
            <span>2 · Register profile</span>
            <span>3 · Zero-knowledge proof</span>
          </div>
        </div>
      </header>

      <main className="layout">
        <WalletConnect status={status} onConnect={connect} onDisconnect={disconnect} />

        <CircuitCall connected={connected} onRegister={registerProfile} />

        <section className="card attest-card">
          <div className="card-header">
            <span className="eyebrow">Level 3 prep</span>
            <h2>GitHub attestation</h2>
            <p className="card-sub">
              Link your GitHub identity through the attester service. The
              returned attestation hash will power Green-tier profiles in a
              future level.
            </p>
          </div>
          <div className="attest-actions">
            {attested ? (
              <div className="status-pill success">
                <span className="dot" /> Attested
                <code className="mono" title={attested}>
                  {' '}
                  {attested.slice(0, 16)}…
                </code>
              </div>
            ) : (
              <a className="btn github" href={`${ATTESTER_URL}/auth/github`}>
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                  />
                </svg>
                Attest with GitHub
              </a>
            )}
            <p className="hint">
              Network: {NETWORK_ID} · Attester: {ATTESTER_URL}
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          What&apos;s public: your commitment hash, trust tier, reveal policy,
          and a pseudo-anonymous caller ID. What stays private: the raw profile.
        </p>
      </footer>
    </div>
  );
}
