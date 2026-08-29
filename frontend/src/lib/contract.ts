/**
 * Browser-side binding to the deployed DevMatch `dev_profile` contract.
 *
 * Mirrors the proven Level 1 deployment flow (`src/deploy.ts`) but for the
 * browser: build the `CompiledContract` with our witnesses, then find the
 * already-deployed contract on-chain with `findDeployedContract`.
 *
 * The `localSecretKey` witness MUST return a stable 32-byte secret per wallet
 * — the contract hashes it into a persistent caller ID (`persistentHash`), so
 * a random secret would mint a new identity on every call. We derive the
 * secret from the wallet's unshielded address (SHA-256), keeping the caller ID
 * stable across sessions while never exposing the raw value.
 */
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { findDeployedContract, type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { Contract, type Witnesses } from '../generated/contract/index.js';
import {
  CONTRACT_ADDRESS,
  NETWORK_ID,
  PRIVATE_STATE_ID,
} from '../config';

/** Derive a stable 32-byte local secret from the wallet's unshielded address. */
export async function deriveLocalSecretKey(address: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(`devmatch:secret:${address}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

/** The contract instance type used by the app. */
export type DevMatchContract = FoundContract<Contract>;

/**
 * Connect to the deployed contract using the given providers.
 * Must be called after `setNetworkId(NETWORK_ID)` has run.
 */
export async function connectToDeployedContract(
  providers: MidnightProviders,
  secret: Uint8Array,
): Promise<DevMatchContract> {
  const witnesses: Witnesses<unknown> = {
    // Keep the private state unchanged (dev_profile stores nothing private)
    // and hand the circuit our stable per-wallet secret.
    localSecretKey: (context) => [context.privateState, secret],
  };

  const compiledContract = CompiledContract.make('DevMatchContract', Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    // withCompiledFileAssets tells the SDK where to find the ZK proving keys
    // and ZKIR files for this circuit. Without this, the proof provider cannot
    // locate registerProfile.prover and registerProfile.zkir, and the WASM
    // runtime receives an incomplete proof input, causing Transaction.deserialize
    // to fail with "expected instance of Wn".
    // The files are served from /zk/ by Vite (copied there by prepare:contract).
    // FetchZkConfigProvider base URL is window.location.origin + '/zk', so
    // passing '' here means "use the base URL directly".
    CompiledContract.withCompiledFileAssets(''),
  );

  // The effect-based SDK types make the browser-side provider set awkward to
  // satisfy structurally; the deploy script casts the same boundary.
  return findDeployedContract(providers as any, {
    compiledContract: compiledContract as any,
    contractAddress: CONTRACT_ADDRESS,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: {},
  });
}

/** Configure the global network id. Run once before any contract operation. */
export function configureNetwork(): void {
  setNetworkId(NETWORK_ID);
}
