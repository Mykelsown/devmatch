/**
 * React hook wrapping the whole Midnight flow:
 *   wallet connect (Lace) -> provider assembly -> contract binding.
 *
 * Exposes a small state machine (idle/connecting/connected/error) plus a
 * `registerProfile` method that hashes the form client-side and calls the
 * `registerProfile` circuit on the deployed contract.
 */
import { useCallback, useRef, useState } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { connectLace, readWalletSnapshot, WalletError, formatBalance } from '../lib/lace';
import { createProviders } from '../lib/providers';
import {
  configureNetwork,
  connectToDeployedContract,
  deriveLocalSecretKey,
  type DevMatchContract,
} from '../lib/contract';
import { NETWORK_ID } from '../config';

export type WalletStatus =
  | { kind: 'idle' }
  | { kind: 'connecting' }
  | { kind: 'connected'; address: string; balance: string }
  | { kind: 'error'; message: string };

export type RegisterOutcome = {
  txId: string;
  commitment: string;
};

export function useMidnight() {
  const [status, setStatus] = useState<WalletStatus>({ kind: 'idle' });
  const apiRef = useRef<ConnectedAPI | null>(null);
  const contractRef = useRef<DevMatchContract | null>(null);

  const connect = useCallback(async () => {
    setStatus({ kind: 'connecting' });
    try {
      // Global network id must be set before ANY contract/wallet op.
      configureNetwork();

      const api = await connectLace(NETWORK_ID);
      const snapshot = await readWalletSnapshot(api);
      const providers = await createProviders(api, snapshot);

      const secret = await deriveLocalSecretKey(snapshot.address);
      const contract = await connectToDeployedContract(providers, secret);

      apiRef.current = api;
      contractRef.current = contract;

      // Show the unshielded balance as a human-friendly number.
      const total = Object.values(snapshot.balances).reduce(
        (acc, b) => acc + b,
        0n,
      );
      setStatus({
        kind: 'connected',
        address: snapshot.address,
        balance: formatBalance(total),
      });
    } catch (err) {
      if (err instanceof WalletError) {
        setStatus({ kind: 'error', message: err.message });
      } else {
        setStatus({
          kind: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    apiRef.current = null;
    contractRef.current = null;
    setStatus({ kind: 'idle' });
  }, []);

  /**
   * Call the `registerProfile` circuit with a pre-hashed commitment.
   * `commitment` is the 32-byte SHA-256 digest of the raw profile — the raw
   * data never leaves the browser and is never passed to the hook.
   */
  const registerProfile = useCallback(
    async (commitment: Uint8Array, tier: number, policy: number): Promise<RegisterOutcome> => {
      const contract = contractRef.current;
      if (!contract) {
        throw new Error('Not connected. Connect your Lace wallet first.');
      }
      const result = await contract.callTx.registerProfile(commitment, tier, policy);
      return {
        txId: result.public.txId,
        commitment: Array.from(commitment)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      };
    },
    [],
  );

  return { status, connect, disconnect, registerProfile };
}
