import mainnetConfig from './network/mainnet.json';
import testnetConfig from './network/testnet.json';

export interface IAdaConfig {
  averageBlockTime: number;
  requiredConfirmations: number;
  explorerEndpoint: string;
}

export const AdaConfig: IAdaConfig = Object.assign({}, mainnetConfig);

// Beside fallback values, we also can update the configurations at the runtime
export function updateAdaConfig(network: string) {
  switch (network) {
    case 'mainnet':
      Object.assign(AdaConfig, mainnetConfig);
      break;
    case 'testnet':
      Object.assign(AdaConfig, testnetConfig);
      break;

    default:
      throw new Error(`Invalid environment variable value: NETWORK=${network}`);
  }
}
export const STATUS_CODE_BAD_REQUEST = 400;
export const STATUS_CODE_NOT_FOUND = 404;
export const STATUS_CODE_SUCCESS = 200;
export const STATUS_CODE_JOB_SUCCESS = 202;
export const NATIVE_UNIT = 'lovelace';
