/**
 * Unit tests for the wallet backends in lib/wallet-backend.ts.
 *
 * The Midnight SDK graph (lace, providers, deployed contract) is mocked so
 * these tests are hermetic and fast; the real `commitment.ts` hashing
 * pipeline runs unchanged, so the MockWalletBackend commitment assertions
 * verify actual SHA-256 behavior.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import {
  LaceWalletBackend,
  OneAmWalletBackend,
  MockWalletBackend,
  resolveBackend,
} from './wallet-backend';
import { bytesToHex, hashProfileToCommitment } from './commitment';
import { NETWORK_ID } from '../config';
import type { DevMatchContract } from './contract';
import type { ProfileInput } from './types';

vi.mock('./lace', () => ({
  connectWallet: vi.fn(),
  readWalletSnapshot: vi.fn(),
  detectWallet: vi.fn(),
  detectAnyWallet: vi.fn(),
  // Plain function: survives vi.resetAllMocks() in afterEach.
  formatBalance: (value: bigint) => value.toLocaleString('en-US'),
}));

vi.mock('./providers', () => ({
  createProviders: vi.fn(),
}));

vi.mock('./contract', () => ({
  configureNetwork: vi.fn(),
  connectToDeployedContract: vi.fn(),
  deriveLocalSecretKey: vi.fn(),
}));

vi.mock('../generated/contract/index.js', () => ({
  Tier: { Yellow: 0, Green: 1 },
  RevealPolicy: { ScoreOnly: 0, FieldsOnPolicy: 1, ApprovalRequired: 2 },
}));

import { connectWallet, detectWallet, detectAnyWallet, readWalletSnapshot } from './lace';
import { createProviders } from './providers';
import {
  configureNetwork,
  connectToDeployedContract,
  deriveLocalSecretKey,
} from './contract';

const INPUT: ProfileInput = {
  name: 'Ada Lovelace',
  stack: ['Rust', 'Zero-knowledge'],
  years: 5,
  hours: 20,
  policy: 'score-only',
  tier: 'yellow',
};

const HEX_64 = /^[0-9a-f]{64}$/;
const TX_ID = /^0x[0-9a-f]{64}$/;

const fakeApi = {} as unknown as ConnectedAPI;
const callTx = vi.fn();
const fakeContract = { callTx: { registerProfile: callTx } } as unknown as DevMatchContract;

const SNAPSHOT = {
  address: 't1qqwalletaddress12345',
  coinPublicKey: 'ck',
  encryptionPublicKey: 'ek',
  balances: { tNIGHT: 123n },
};

function stubMidnightFlow(balances: Record<string, bigint> = { tNIGHT: 0n }) {
  vi.mocked(connectWallet).mockResolvedValue(fakeApi);
  vi.mocked(readWalletSnapshot).mockResolvedValue({ ...SNAPSHOT, balances });
  vi.mocked(createProviders).mockResolvedValue({} as never);
  vi.mocked(deriveLocalSecretKey).mockResolvedValue(new Uint8Array(32));
  vi.mocked(connectToDeployedContract).mockResolvedValue(fakeContract);
}

beforeEach(() => {
  // Only the delay() timers are faked — keep Date/crypto on real time.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe('MockWalletBackend', () => {
  it('is always available and identifies as the demo wallet', () => {
    const backend = new MockWalletBackend();
    expect(backend.isAvailable()).toBe(true);
    expect(backend.mode).toBe('mock');
    expect(backend.label).toBe('Demo wallet');
  });

  it('connect() returns the demo snapshot shape', async () => {
    const promise = new MockWalletBackend().connect();
    await vi.runAllTimersAsync();
    const snap = await promise;
    expect(snap.mode).toBe('mock');
    expect(snap.address).toMatch(/^t1qq/);
    expect(snap.shortAddress).toBe(`${snap.address.slice(0, 6)}…${snap.address.slice(-4)}`);
    expect(snap.balance).toBe('42,069');
    expect(snap.network).toBe('preview (demo)');
  });

  it('registerProfile() returns the on-chain receipt shape', async () => {
    const backend = new MockWalletBackend();
    const promise = backend.registerProfile(INPUT);
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.commitment).toMatch(HEX_64);
    expect(res.txId).toMatch(TX_ID);
    expect(res.tier).toBe('yellow');
    expect(res.policy).toBe('score-only');
    expect(res.network).toBe('preview (demo)');
  });

  it('commitment is the real SHA-256 of the canonical profile (deterministic)', async () => {
    const backend = new MockWalletBackend();
    const promise = backend.registerProfile(INPUT);
    await vi.runAllTimersAsync();
    const res = await promise;

    const expected = bytesToHex(
      await hashProfileToCommitment({
        name: INPUT.name,
        stack: INPUT.stack,
        years: INPUT.years,
        hours: INPUT.hours,
      }),
    );
    expect(res.commitment).toBe(expected);
  });

  it('different profiles produce different commitments and tx ids', async () => {
    const backend = new MockWalletBackend();
    const p1 = backend.registerProfile(INPUT);
    await vi.runAllTimersAsync();
    const r1 = await p1;

    const p2 = backend.registerProfile({ ...INPUT, name: 'Grace Hopper' });
    await vi.runAllTimersAsync();
    const r2 = await p2;

    expect(r1.commitment).not.toBe(r2.commitment);
    expect(r1.txId).not.toBe(r2.txId);
  });

  it('disconnect() resolves without error', async () => {
    await expect(new MockWalletBackend().disconnect()).resolves.toBeUndefined();
  });
});

describe('LaceWalletBackend', () => {
  it('isAvailable() delegates to the Lace detection', () => {
    const backend = new LaceWalletBackend();
    vi.mocked(detectWallet).mockReturnValue({} as never);
    expect(backend.isAvailable()).toBe(true);
    vi.mocked(detectWallet).mockReturnValue(undefined);
    expect(backend.isAvailable()).toBe(false);
  });

  it('connect() assembles the real flow and returns a midnight snapshot', async () => {
    stubMidnightFlow({ tNIGHT: 123n });

    const backend = new LaceWalletBackend();
    const snap = await backend.connect();

    expect(configureNetwork).toHaveBeenCalledTimes(1);
    expect(connectWallet).toHaveBeenCalledWith(NETWORK_ID, 'lace');
    expect(deriveLocalSecretKey).toHaveBeenCalledWith(SNAPSHOT.address);
    expect(snap.mode).toBe('midnight');
    expect(snap.address).toBe(SNAPSHOT.address);
    expect(snap.shortAddress).toBe('t1qqwa…2345');
    expect(snap.balance).toBe('123');
    expect(snap.network).toBe(NETWORK_ID);
  });

  it('registerProfile() before connect rejects with a friendly error', async () => {
    const backend = new LaceWalletBackend();
    await expect(backend.registerProfile(INPUT)).rejects.toThrow(/connect/i);
  });

  it('registerProfile() maps tier/policy to contract enums and returns the receipt', async () => {
    callTx.mockResolvedValue({ public: { txId: '0xdeadbeef' } });
    stubMidnightFlow();

    const backend = new LaceWalletBackend();
    await backend.connect();
    const res = await backend.registerProfile({
      ...INPUT,
      tier: 'green',
      policy: 'fields-on-policy',
    });

    // Tier.Green = 1, RevealPolicy.FieldsOnPolicy = 1 (mocked enums).
    expect(callTx).toHaveBeenCalledWith(expect.any(Uint8Array), 1, 1);
    const commitment = callTx.mock.calls[0][0] as Uint8Array;
    expect(commitment).toHaveLength(32);

    expect(res.commitment).toMatch(HEX_64);
    expect(res.txId).toBe('0xdeadbeef');
    expect(res.tier).toBe('green');
    expect(res.policy).toBe('fields-on-policy');
    expect(res.network).toBe(NETWORK_ID);
  });

  it('disconnect() clears the contract so registration rejects again', async () => {
    stubMidnightFlow();

    const backend = new LaceWalletBackend();
    await backend.connect();
    await backend.disconnect();
    await expect(backend.registerProfile(INPUT)).rejects.toThrow(/connect/i);
  });
});

describe('OneAmWalletBackend', () => {
  it('isAvailable() delegates to the 1AM detection', () => {
    const backend = new OneAmWalletBackend();
    vi.mocked(detectWallet).mockReturnValue({} as never);
    expect(backend.isAvailable()).toBe(true);
    vi.mocked(detectWallet).mockReturnValue(undefined);
    expect(backend.isAvailable()).toBe(false);
  });

  it('connect() assembles the real flow and returns a midnight snapshot', async () => {
    stubMidnightFlow({ tNIGHT: 456n });

    const backend = new OneAmWalletBackend();
    const snap = await backend.connect();

    expect(configureNetwork).toHaveBeenCalledTimes(1);
    expect(connectWallet).toHaveBeenCalledWith(NETWORK_ID, '1am');
    expect(deriveLocalSecretKey).toHaveBeenCalledWith(SNAPSHOT.address);
    expect(snap.mode).toBe('midnight');
    expect(snap.address).toBe(SNAPSHOT.address);
    expect(snap.shortAddress).toBe('t1qqwa…2345');
    expect(snap.balance).toBe('456');
    expect(snap.network).toBe(NETWORK_ID);
  });

  it('registerProfile() before connect rejects with a friendly error', async () => {
    const backend = new OneAmWalletBackend();
    await expect(backend.registerProfile(INPUT)).rejects.toThrow(/connect/i);
  });
});

describe('resolveBackend', () => {
  it('always returns the demo backend for "mock", even when wallets are present', () => {
    vi.mocked(detectWallet).mockReturnValue({} as never);
    expect(resolveBackend('mock')).toBeInstanceOf(MockWalletBackend);
  });

  it('always returns the Lace backend for "lace", even without Lace installed', () => {
    vi.mocked(detectWallet).mockReturnValue(undefined);
    expect(resolveBackend('lace')).toBeInstanceOf(LaceWalletBackend);
  });

  it('always returns the 1AM backend for "1am", even without 1AM installed', () => {
    vi.mocked(detectWallet).mockReturnValue(undefined);
    expect(resolveBackend('1am')).toBeInstanceOf(OneAmWalletBackend);
  });

  it('"auto" prefers Lace when installed', () => {
    vi.mocked(detectWallet).mockReturnValue(undefined);
    vi.mocked(detectAnyWallet).mockReturnValue(['lace']);
    expect(resolveBackend('auto')).toBeInstanceOf(LaceWalletBackend);
  });

  it('"auto" falls back to 1AM when only 1AM is installed', () => {
    vi.mocked(detectWallet).mockReturnValue(undefined);
    vi.mocked(detectAnyWallet).mockReturnValue(['1am']);
    expect(resolveBackend('auto')).toBeInstanceOf(OneAmWalletBackend);
  });

  it('"auto" falls back to the demo backend when no wallets are installed', () => {
    vi.mocked(detectWallet).mockReturnValue(undefined);
    vi.mocked(detectAnyWallet).mockReturnValue([]);
    expect(resolveBackend('auto')).toBeInstanceOf(MockWalletBackend);
  });
});
