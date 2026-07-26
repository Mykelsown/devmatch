import path from 'node:path';
import { Contract, ledger } from './managed/dev_profile/contract/index.js';
import { type Witnesses } from './managed/dev_profile/contract/index.js';
import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export { Contract, ledger };
export { Tier, RevealPolicy } from './managed/dev_profile/contract/index.js';

export const zkConfigPath = path.resolve(
  new URL(import.meta.url).pathname,
  '../managed/dev_profile',
);

const witnesses: Witnesses<Record<string, never>> = {
  localSecretKey: (context: __compactRuntime.WitnessContext<any, any>) => {
    const sk = new Uint8Array(32);
    crypto.getRandomValues(sk);
    return [context.privateState, sk];
  },
};

export const CompiledDevMatchContract = new Contract(witnesses);
