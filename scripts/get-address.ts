import pino from 'pino';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { getConfig } from '../src/config.js';
import { MidnightWalletProvider } from '../src/wallet.js';
import { MidnightBech32m } from '@midnight-ntwrk/wallet-sdk';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

const logger = pino({ level: 'warn', transport: { target: 'pino-pretty' } });
const config = getConfig();
setNetworkId(config.networkId);

const network = process.env['MIDNIGHT_NETWORK'] ?? 'local';
const upper = network.toUpperCase();
const mnemonic = process.env[`MIDNIGHT_${upper}_MNEMONIC`];
if (!mnemonic) throw new Error(`MIDNIGHT_${upper}_MNEMONIC not set`);

const envConfig: EnvironmentConfiguration = { walletNetworkId: config.networkId, ...config };
const wallet = await MidnightWalletProvider.build(logger, envConfig, {
  kind: 'mnemonic',
  value: mnemonic,
});
await wallet.start();

const state = await firstValueFrom(wallet.wallet.state().pipe(take(1)));
const addrObj = (state as any).unshielded?.address;

try {
  const encoded = MidnightBech32m.encode(config.networkId, addrObj);
  console.log('\n=============================');
  console.log('WALLET ADDRESS:', encoded.toString());
  console.log('=============================\n');
} catch(e: any) {
  console.log('Error encoding address:', e.message);
}

process.exit(0);
