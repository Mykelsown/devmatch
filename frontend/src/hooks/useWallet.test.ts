// @vitest-environment jsdom
/**
 * Unit tests for the useWallet hook: the status state machine
 * (idle → connecting → connected / error, disconnect back to idle) and
 * backend switching via choose(). The wallet-backend seam is mocked, so the
 * hook is exercised in isolation with deterministic fake backends.
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWallet } from './useWallet';
import { resolveBackend } from '../lib/wallet-backend';
import type { WalletBackend } from '../lib/wallet-backend';
import type { ProfileInput, RegisterResult, WalletSnapshot } from '../lib/types';

vi.mock('../lib/wallet-backend', () => ({
  resolveBackend: vi.fn(),
}));

const SNAP: WalletSnapshot = {
  address: 't1qqwalletaddress12345',
  shortAddress: 't1qqwa…2345',
  balance: '123',
  network: 'preview',
  mode: 'mock',
};

const INPUT: ProfileInput = {
  name: 'Ada Lovelace',
  stack: ['Rust'],
  years: 5,
  hours: 20,
  policy: 'score-only',
  tier: 'yellow',
};

const RECEIPT: RegisterResult = {
  commitment: 'ab'.repeat(32),
  txId: '0xdeadbeef',
  tier: 'yellow',
  policy: 'score-only',
  network: 'preview',
};

function makeFakeBackend(
  mode: 'midnight' | 'mock' = 'mock',
  overrides: Partial<WalletBackend> = {},
): WalletBackend {
  return {
    mode,
    label: mode === 'mock' ? 'Demo wallet' : 'Lace',
    isAvailable: vi.fn(() => true),
    connect: vi.fn(),
    disconnect: vi.fn(),
    registerProfile: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(resolveBackend).mockReturnValue(makeFakeBackend());
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('useWallet status transitions', () => {
  it('starts idle with no snapshot and resolves the auto backend', () => {
    const fake = makeFakeBackend('mock');
    vi.mocked(resolveBackend).mockReturnValue(fake);
    const { result } = renderHook(() => useWallet());

    expect(result.current.status).toEqual({ kind: 'idle' });
    expect(result.current.snapshot).toBeNull();
    expect(result.current.choice).toBe('auto');
    expect(resolveBackend).toHaveBeenCalledWith('auto');
    expect(result.current.backend).toBe(fake);
  });

  it('connect() runs idle → connecting → connected and stores the snapshot', async () => {
    const fake = makeFakeBackend('mock', { connect: vi.fn().mockResolvedValue(SNAP) });
    vi.mocked(resolveBackend).mockReturnValue(fake);
    const { result } = renderHook(() => useWallet());

    let connectPromise!: Promise<void>;
    act(() => {
      connectPromise = result.current.connect();
    });
    // The connecting state is set synchronously before the backend resolves.
    expect(result.current.status).toEqual({ kind: 'connecting' });

    await act(async () => {
      await connectPromise;
    });
    expect(result.current.status).toEqual({ kind: 'connected' });
    expect(result.current.snapshot).toEqual(SNAP);
    expect(fake.connect).toHaveBeenCalledTimes(1);
  });

  it('connect() failure lands in error with the message and no snapshot', async () => {
    const fake = makeFakeBackend('mock', {
      connect: vi.fn().mockRejectedValue(new Error('wallet rejected')),
    });
    vi.mocked(resolveBackend).mockReturnValue(fake);
    const { result } = renderHook(() => useWallet());

    let connectPromise!: Promise<void>;
    act(() => {
      connectPromise = result.current.connect();
    });
    expect(result.current.status).toEqual({ kind: 'connecting' });

    await act(async () => {
      await connectPromise;
    });
    expect(result.current.status).toEqual({ kind: 'error', message: 'wallet rejected' });
    expect(result.current.snapshot).toBeNull();
  });

  it('non-Error rejections are stringified into the message', async () => {
    const fake = makeFakeBackend('mock', { connect: vi.fn().mockRejectedValue('nope') });
    vi.mocked(resolveBackend).mockReturnValue(fake);
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.status).toEqual({ kind: 'error', message: 'nope' });
  });

  it('disconnect() calls the backend and resets to idle', async () => {
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const fake = makeFakeBackend('mock', {
      connect: vi.fn().mockResolvedValue(SNAP),
      disconnect,
    });
    vi.mocked(resolveBackend).mockReturnValue(fake);
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.status.kind).toBe('connected');

    await act(async () => {
      await result.current.disconnect();
    });
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(result.current.status).toEqual({ kind: 'idle' });
    expect(result.current.snapshot).toBeNull();
  });
});

describe('useWallet backend switching', () => {
  it('choose() swaps the backend, disconnects the old one, and resets state', async () => {
    const oldDisconnect = vi.fn().mockResolvedValue(undefined);
    const oldBackend = makeFakeBackend('mock', {
      connect: vi.fn().mockResolvedValue(SNAP),
      disconnect: oldDisconnect,
    });
    vi.mocked(resolveBackend).mockReturnValue(oldBackend);
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.status.kind).toBe('connected');

    const newBackend = makeFakeBackend('midnight');
    vi.mocked(resolveBackend).mockReturnValue(newBackend);
    act(() => {
      result.current.choose('lace');
    });

    expect(oldDisconnect).toHaveBeenCalledTimes(1);
    expect(result.current.choice).toBe('lace');
    expect(result.current.backend).toBe(newBackend);
    expect(result.current.status).toEqual({ kind: 'idle' });
    expect(result.current.snapshot).toBeNull();
    expect(resolveBackend).toHaveBeenCalledWith('lace');
  });

  it('choose() with the current choice is a no-op (no second disconnect)', () => {
    const disconnect = vi.fn();
    const fake = makeFakeBackend('mock', { disconnect });
    vi.mocked(resolveBackend).mockReturnValue(fake);
    const { result } = renderHook(() => useWallet());

    act(() => {
      result.current.choose('mock');
    });
    expect(result.current.choice).toBe('mock');
    expect(disconnect).toHaveBeenCalledTimes(1); // first switch disconnects the old backend

    // Intentional: resolveBackend returns the same fake for 'auto' and 'mock',
    // so the backend instance is stable and the no-op assertion below is
    // meaningful rather than trivially true.
    const backendAfterSwitch = result.current.backend;
    act(() => {
      result.current.choose('mock');
    });
    expect(disconnect).toHaveBeenCalledTimes(1); // same choice → early return
    expect(result.current.backend).toBe(backendAfterSwitch);
    expect(result.current.choice).toBe('mock');
  });

  it('registerProfile() delegates to the active backend and passes the input through', async () => {
    const registerProfile = vi.fn().mockResolvedValue(RECEIPT);
    vi.mocked(resolveBackend).mockReturnValue(
      makeFakeBackend('mock', { registerProfile }),
    );
    const { result } = renderHook(() => useWallet());

    let out!: RegisterResult;
    await act(async () => {
      out = await result.current.registerProfile(INPUT);
    });
    expect(registerProfile).toHaveBeenCalledWith(INPUT);
    expect(out).toEqual(RECEIPT);
  });
});
