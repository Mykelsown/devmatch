/**
 * `useWallet` — connection state machine over a `WalletBackend`.
 *
 * The UI never talks to Lace or the contract directly; it talks to this hook,
 * which delegates to whichever backend is active (demo or Midnight).
 */
import { useCallback, useMemo, useState } from 'react';
import {
  resolveBackend,
  type BackendChoice,
  type WalletBackend,
} from '../lib/wallet-backend';
import type { ProfileInput, RegisterResult, WalletSnapshot } from '../lib/types';
import { WalletError, type WalletErrorKind } from '../lib/lace';

export type WalletStatus =
  | { kind: 'idle' }
  | { kind: 'connecting' }
  | { kind: 'connected' }
  | { kind: 'error'; message: string; errorKind?: WalletErrorKind };

export interface WalletController {
  backend: WalletBackend;
  choice: BackendChoice;
  choose: (choice: BackendChoice) => void;
  status: WalletStatus;
  snapshot: WalletSnapshot | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  registerProfile: (input: ProfileInput) => Promise<RegisterResult>;
}

export function useWallet(): WalletController {
  const [choice, setChoice] = useState<BackendChoice>('auto');
  const backend = useMemo(() => resolveBackend(choice), [choice]);
  const [snapshot, setSnapshot] = useState<WalletSnapshot | null>(null);
  const [status, setStatus] = useState<WalletStatus>({ kind: 'idle' });

  const connect = useCallback(async () => {
    setStatus({ kind: 'connecting' });
    try {
      const snap = await backend.connect();
      setSnapshot(snap);
      setStatus({ kind: 'connected' });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : String(err),
        ...(err instanceof WalletError ? { errorKind: err.kind } : {}),
      });
    }
  }, [backend]);

  const disconnect = useCallback(async () => {
    await backend.disconnect();
    setSnapshot(null);
    setStatus({ kind: 'idle' });
  }, [backend]);

  const choose = useCallback(
    (next: BackendChoice) => {
      if (next === choice) return;
      void backend.disconnect();
      setSnapshot(null);
      setStatus({ kind: 'idle' });
      setChoice(next);
    },
    [backend, choice],
  );

  const registerProfile = useCallback(
    (input: ProfileInput) => backend.registerProfile(input),
    [backend],
  );

  return {
    backend,
    choice,
    choose,
    status,
    snapshot,
    connect,
    disconnect,
    registerProfile,
  };
}
