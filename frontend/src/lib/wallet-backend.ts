/**
 * Wallet backend — the single seam between the UI and the network.
 *
 * The build spec asks for wallet/contract calls to be stubbed behind a clean
 * interface for now. This module defines that interface and ships TWO
 * implementations:
 *
 *   - `MockWalletBackend`   — a demo wallet with simulated latency, so the
 *     whole UI is explorable without Lace or a deployed contract.
 *   - `MidnightWalletBackend` — the real Level-2 flow: Lace connect →
 *     provider assembly → deployed `dev_profile` contract call. It reuses the
 *     existing `lib/lace`, `lib/providers`, `lib/contract` and
 *     `lib/commitment` wiring.
 *
 * `pickBackend()` auto-selects the real backend when Lace is installed and
 * falls back to the demo wallet otherwise; the connect modal lets the user
 * override that choice.
 */
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import {
  Tier as ContractTier,
  RevealPolicy as ContractRevealPolicy,
} from '../generated/contract/index.js';
import {
  connectLace,
  readWalletSnapshot,
  detectLace,
  formatBalance,
} from './lace';
import { createProviders } from './providers';
import {
  configureNetwork,
  connectToDeployedContract,
  deriveLocalSecretKey,
  type DevMatchContract,
} from './contract';
import { hashProfileToCommitment, bytesToHex } from './commitment';
import { NETWORK_ID } from '../config';
import type { ProfileInput, RegisterResult, RevealPolicy, TrustTier, WalletSnapshot } from './types';

export type BackendChoice = 'auto' | 'midnight' | 'mock';

export interface WalletBackend {
  readonly mode: 'midnight' | 'mock';
  readonly label: string;
  /** Whether this backend can work in the current environment. */
  isAvailable(): boolean;
  connect(): Promise<WalletSnapshot>;
  disconnect(): Promise<void>;
  registerProfile(input: ProfileInput): Promise<RegisterResult>;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TIER_TO_CONTRACT: Record<TrustTier, ContractTier> = {
  yellow: ContractTier.Yellow,
  green: ContractTier.Green,
};

const POLICY_TO_CONTRACT: Record<RevealPolicy, ContractRevealPolicy> = {
  'score-only': ContractRevealPolicy.ScoreOnly,
  'fields-on-policy': ContractRevealPolicy.FieldsOnPolicy,
  'approval-required': ContractRevealPolicy.ApprovalRequired,
};

function randomHex(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ─── Demo backend ────────────────────────────────────────────────────────── */

export class MockWalletBackend implements WalletBackend {
  readonly mode = 'mock' as const;
  readonly label = 'Demo wallet';

  isAvailable(): boolean {
    return true;
  }

  async connect(): Promise<WalletSnapshot> {
    await delay(900);
    const address = 't1qqd3v7j8n0x4k2m9f6y1p5q8a';
    return {
      address,
      shortAddress: `${address.slice(0, 6)}…${address.slice(-4)}`,
      balance: '42,069',
      network: 'preview (demo)',
      mode: 'mock',
    };
  }

  async disconnect(): Promise<void> {
    // Nothing to release — demo session is stateless.
  }

  async registerProfile(input: ProfileInput): Promise<RegisterResult> {
    await delay(1800); // simulated proof generation + ledger write
    const commitment = bytesToHex(
      await hashProfileToCommitment({
        name: input.name,
        stack: input.stack,
        years: input.years,
        hours: input.hours,
      }),
    );
    return {
      commitment,
      txId: `0x${randomHex(32)}`,
      tier: input.tier,
      policy: input.policy,
      network: 'preview (demo)',
    };
  }
}

/* ─── Midnight backend (real Level-2 flow) ────────────────────────────────── */

export class MidnightWalletBackend implements WalletBackend {
  readonly mode = 'midnight' as const;
  readonly label = 'Lace · Midnight';

  private api: ConnectedAPI | null = null;
  private contract: DevMatchContract | null = null;

  isAvailable(): boolean {
    return detectLace() !== undefined;
  }

  async connect(): Promise<WalletSnapshot> {
    configureNetwork();
    const api = await connectLace(NETWORK_ID);
    const snapshot = await readWalletSnapshot(api);
    const providers = await createProviders(api, snapshot);

    // Stable per-wallet secret → persistent caller id (see lib/contract.ts).
    const secret = await deriveLocalSecretKey(snapshot.address);
    const contract = await connectToDeployedContract(providers, secret);

    this.api = api;
    this.contract = contract;

    const total = Object.values(snapshot.balances).reduce((a, b) => a + b, 0n);
    return {
      address: snapshot.address,
      shortAddress: `${snapshot.address.slice(0, 6)}…${snapshot.address.slice(-4)}`,
      balance: formatBalance(total),
      network: NETWORK_ID,
      mode: 'midnight',
    };
  }

  async disconnect(): Promise<void> {
    this.api = null;
    this.contract = null;
  }

  async registerProfile(input: ProfileInput): Promise<RegisterResult> {
    const contract = this.contract;
    if (!contract) {
      throw new Error('Wallet not connected. Connect Lace first, then register your profile.');
    }

    // Hash in-browser — only the 32-byte digest leaves this device.
    const commitment = await hashProfileToCommitment({
      name: input.name,
      stack: input.stack,
      years: input.years,
      hours: input.hours,
    });
    const result = await contract.callTx.registerProfile(
      commitment,
      TIER_TO_CONTRACT[input.tier] as number,
      POLICY_TO_CONTRACT[input.policy] as number,
    );

    return {
      commitment: bytesToHex(commitment),
      txId: result.public.txId,
      tier: input.tier,
      policy: input.policy,
      network: NETWORK_ID,
    };
  }
}

/** Resolve the user's backend choice; 'auto' prefers Lace when installed. */
export function resolveBackend(choice: BackendChoice): WalletBackend {
  if (choice === 'mock') return new MockWalletBackend();
  const midnight = new MidnightWalletBackend();
  if (choice === 'midnight') return midnight;
  return midnight.isAvailable() ? midnight : new MockWalletBackend();
}
