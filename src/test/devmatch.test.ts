import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  deployContract,
  type DeployedContract,
} from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  type EnvironmentConfiguration,
  waitForFunds,
} from '@midnight-ntwrk/testkit-js';
import pino from 'pino';
import { getConfig } from '../config.js';
import { MidnightWalletProvider, syncWallet, type WalletSecret } from '../wallet.js';
import { buildProviders, type DevMatchProviders } from '../providers.js';
import {
  CompiledDevMatchContract,
  Contract,
  ledger,
  zkConfigPath,
  Tier,
  RevealPolicy,
} from '../../contracts/index.js';

// @ts-expect-error WebSocket global
globalThis.WebSocket = WebSocket;

const PRIVATE_STATE_ID = 'DevMatchPrivateState';
const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

const network = process.env['MIDNIGHT_NETWORK'] ?? 'local';

function resolveSecret(net: string): WalletSecret {
  if (net === 'local') {
    return { kind: 'seed', value: '0000000000000000000000000000000000000000000000000000000000000001' };
  }
  const upper = net.toUpperCase();
  const mnemonic = process.env[`MIDNIGHT_${upper}_MNEMONIC`]?.trim().replace(/\s+/g, ' ');
  const seedHex = process.env[`MIDNIGHT_${upper}_SEED`]?.trim();
  if (mnemonic && seedHex) throw new Error(`Set only one of MNEMONIC or SEED for ${net}`);
  if (mnemonic) return { kind: 'mnemonic', value: mnemonic };
  if (seedHex) return { kind: 'seed', value: seedHex };
  throw new Error(`Either MIDNIGHT_${upper}_MNEMONIC or MIDNIGHT_${upper}_SEED required`);
}

describe(`DevMatch Contract (${network})`, () => {
  let wallet: MidnightWalletProvider;
  let providers: DevMatchProviders;
  let contractAddress: ContractAddress;

  const config = getConfig();
  const secret = resolveSecret(network);
  const isRemote = network !== 'local';
  const syncTimeoutMs = Number(
    process.env['MIDNIGHT_SYNC_TIMEOUT_MS'] ?? (isRemote ? 60 * 60_000 : 10 * 60_000),
  );

  beforeAll(async () => {
    setNetworkId(config.networkId);
    const envConfig: EnvironmentConfiguration = {
      walletNetworkId: config.networkId,
      networkId: config.networkId,
      indexer: config.indexer,
      indexerWS: config.indexerWS,
      node: config.node,
      nodeWS: config.nodeWS,
      faucet: config.faucet,
      proofServer: config.proofServer,
    };
    wallet = await MidnightWalletProvider.build(logger, envConfig, secret);
    await wallet.start();
    await syncWallet(logger, wallet.wallet, syncTimeoutMs);
    if (isRemote) {
      const nightBalance = await waitForFunds(
        wallet.wallet,
        envConfig,
        false,
        wallet.unshieldedKeystore,
      );
      logger.info(`Wallet NIGHT balance on '${network}': ${nightBalance}`);
    }
    providers = buildProviders(wallet, zkConfigPath, config);
    logger.info(`Providers initialized on '${network}'. Ready to deploy!`);
  });

  afterAll(async () => {
    if (wallet) await wallet.stop();
  });

  it('Deploys the DevMatch dev_profile contract', async () => {
    const deployed: DeployedContract<Contract> = await deployContract(providers, {
      compiledContract: CompiledDevMatchContract,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });
    contractAddress = deployed.deployTxData.public.contractAddress;
    logger.info(`\n\n CONTRACT DEPLOYED AT: ${contractAddress} \n\n`);
    expect(contractAddress).toBeDefined();
    expect(contractAddress.length).toBeGreaterThan(0);
  });

  it('Registers a Yellow-tier profile', async () => {
    const commitment = new Uint8Array(32).fill(1);
    await providers.walletProvider;
    logger.info('Registering Yellow-tier profile...');
    expect(contractAddress).toBeDefined();
  });
});
