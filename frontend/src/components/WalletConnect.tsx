/**
 * Wallet connection card.
 *
 * Handles the Lace connect/disconnect flow and surfaces friendly errors for
 * the common failure modes (wallet not installed, user rejected, network
 * mismatch).
 */
import type { WalletStatus } from '../hooks/useMidnight';
import { detectLace } from '../lib/lace';
import { NETWORK_ID } from '../config';

export function WalletConnect({
  status,
  onConnect,
  onDisconnect,
}: {
  status: WalletStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const laceInstalled = detectLace() !== undefined;

  return (
    <section className="card wallet-card">
      <div className="card-header">
        <span className="eyebrow">Step 1</span>
        <h2>Connect your wallet</h2>
      </div>

      {status.kind === 'connected' && (
        <div className="wallet-connected">
          <div className="status-pill success">
            <span className="dot" /> Connected
          </div>
          <dl className="wallet-details">
            <div>
              <dt>Address</dt>
              <dd className="mono" title={status.address}>
                {status.address.slice(0, 18)}…{status.address.slice(-10)}
              </dd>
            </div>
            <div>
              <dt>tNIGHT balance</dt>
              <dd>{status.balance}</dd>
            </div>
          </dl>
          <button className="btn ghost" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      )}

      {status.kind === 'connecting' && (
        <div className="wallet-connecting">
          <div className="spinner" aria-hidden="true" />
          <p>Waiting for Lace…</p>
          <p className="hint">
            Approve the connection request in the wallet popup on {NETWORK_ID}.
          </p>
        </div>
      )}

      {(status.kind === 'idle' || status.kind === 'error') && (
        <div className="wallet-actions">
          {!laceInstalled && (
            <p className="warning">
              Lace wallet not detected. Install the{' '}
              <a
                href="https://chromewebstore.google.com/detail/lace/afkphoeejbbklcjcagepaknnnmjjkkff"
                target="_blank"
                rel="noreferrer"
              >
                Lace extension
              </a>
              , set it to {NETWORK_ID}, then refresh.
            </p>
          )}
          <button className="btn primary" onClick={onConnect}>
            Connect Lace
          </button>
          {status.kind === 'error' && (
            <p className="error" role="alert">
              {status.message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
