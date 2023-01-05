import {
  BitcoinCashBasedGateway,
  implement,
  CurrencyRegistry,
  GatewayRegistry,
  getLogger,
  BigNumber,
  Account,
  EnvConfigRegistry,
  override,
  IInsightUtxoInfo,
  IRawVOut,
  IRawTransaction,
} from 'sota-common';
import { inspect } from 'util';
const bchaddr = require('bchaddrjs');
const logger = getLogger('BchGateway');

const bitcore = require('bitcore-lib-cash');

GatewayRegistry.registerLazyCreateMethod(CurrencyRegistry.BitcoinCash, () => new BchGateway());

export class BchGateway extends BitcoinCashBasedGateway {
  public constructor() {
    super(CurrencyRegistry.BitcoinCash);
  }

  public async getFeeInSatoshisPerByte(): Promise<number> {
    return 2;
  }

  @implement
  public getBitCoreLib(): any {
    return bitcore;
  }

  public async getAccountFromPrivateKey(rawPrivateKey: string): Promise<Account> {
    const bitcoreLib = this.getBitCoreLib();
    const network = EnvConfigRegistry.isMainnet() ? bitcoreLib.Networks.mainnet : bitcoreLib.Networks.testnet;
    const privateKey = new bitcoreLib.PrivateKey(rawPrivateKey, network);
    const address = privateKey.toAddress().toString();
    const legacyAddress = bchaddr.toLegacyAddress(address);
    return { address: legacyAddress, privateKey: privateKey.toWIF() };
    // return { address: this.toBCHAddress(address), privateKey: privateKey.toWIF() };
  }

  public toBCHAddress(address: string): string {
    return bchaddr.toCashAddress(address).split(':')[1];
  }
  public async createAccountAsync(): Promise<Account> {
    const bitcoreLib = this.getBitCoreLib();
    const network = EnvConfigRegistry.isMainnet() ? bitcoreLib.Networks.mainnet : bitcoreLib.Networks.testnet;
    const privateKey = new bitcoreLib.PrivateKey(null, network);
    const wif = privateKey.toWIF();
    const address = privateKey.toAddress();

    return {
      address: bchaddr.toLegacyAddress(address.toString()),
      privateKey: wif,
    };
  }
  /**
   * minimum fee for seeding in almost case
   */
  public async getAverageSeedingFee(): Promise<BigNumber> {
    throw new Error(`TODO: Implement me.`);
  }

  public async isValidAddressAsync(address: string): Promise<boolean> {
    const bitcoreLib = this.getBitCoreLib();
    const network = EnvConfigRegistry.isMainnet() ? bitcoreLib.Networks.mainnet : bitcoreLib.Networks.testnet;
    let curAddress;
    try {
      if (bchaddr.isCashAddress(address) || bchaddr.isLegacyAddress(address)) {
        curAddress = bchaddr.toCashAddress(address);
      } else {
        return false;
      }
    } catch (e) {
      logger.error(`Could not validate address ${address} due to error: ${inspect(e)}`);
      return false;
    }

    try {
      return bitcore.Address.isValid(curAddress, network);
    } catch (e) {
      logger.error(`Could not validate address ${address} due to error: ${inspect(e)}`);
    }

    return false;
  }

  public getTypesAddress(address: string): object {
    try {
      return { cashAddress: bchaddr.toCashAddress(address), legacyAddress: bchaddr.toLegacyAddress(address) };
    } catch (e) {
      logger.error(`Could not get type address ${address} due to error: ${inspect(e)}`);
      return {};
    }
  }
}

export default BchGateway;
