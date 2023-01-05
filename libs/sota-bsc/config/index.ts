import mainnetConfig from './network/mainnet.json';
import testnetConfig from './network/testnet.json';

export interface IBscConfig {
  averageBlockTime: number;
  requiredConfirmations: number;
  explorerEndpoint: string;
  chainId: number;
}

export const EthConfig: IBscConfig = Object.assign({}, mainnetConfig);

// Beside fallback values, we also can update the configurations at the runtime
export function updateEthConfig(network: string) {
  switch (network) {
    case 'bsc':
      Object.assign(EthConfig, mainnetConfig);
      break;
    case 'bsctestnet':
      Object.assign(EthConfig, testnetConfig);
      break;

    default:
      throw new Error(`Invalid environment variable value: NETWORK=${process.env.NETWORK}`);
  }
}
