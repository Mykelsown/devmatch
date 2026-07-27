import pino from 'pino';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { getConfig } from '../src/config.js';
import { MidnightWalletProvider } from '../src/wallet.js';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

const logger = pino({ level: 'warn', transport: { target: 'pino-pretty' } });
const config = getConfig();
setNetworkId(config.networkId);

const mnemonic = process.env[`MIDNIGHT_${(process.env['MIDNIGHT_NETWORK'] ?? 'local').toUpperCase()}_MNEMONIC`];
if (!mnemonic) throw new Error('MIDNIGHT_PREPROD_MNEMONIC not set');

const envConfig: EnvironmentConfiguration = { walletNetworkId: config.networkId, ...config };
const wallet = await MidnightWalletProvider.build(logger, envConfig, {
  kind: 'mnemonic',
  value: mnemonic,
});
await wallet.start();

console.log('Waiting 20 seconds for wallet to sync...');
await new Promise(r => setTimeout(r, 20000));

const state = await firstValueFrom(wallet.wallet.state().pipe(take(1)));

console.log('\n=============================');
console.log('BALANCES:');
console.log('tNight (unshielded):', (state as any).unshielded?.balance?.toString() ?? '0');
console.log('tDust coins:', (state as any).dust?.availableCoins?.length ?? 0);
console.log('unshielded connected:', (state as any).unshielded?.progress?.isConnected);
console.log('=============================\n');

process.exit(0);
