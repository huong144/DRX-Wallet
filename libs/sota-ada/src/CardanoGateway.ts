import * as _ from 'lodash';
import {
  BaseGateway,
  ISignedRawTransaction,
  TransactionStatus,
  Account,
  IRawTransaction,
  getLogger,
  Block,
  CurrencyRegistry,
  EnvConfigRegistry,
  override,
  IRawVOut,
  implement,
  BigNumber,
  GatewayRegistry,
} from 'sota-common';
import CardanoAcount from './CardanoAccount';
import { CardanoTransaction } from './CardanoTransaction';
import bip39 from 'bip39';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { RequestInit, Response, RequestInfo } from 'node-fetch';
import CardanoTransactions from './CardanoTransactions';
import {
  NATIVE_UNIT,
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_JOB_SUCCESS,
  STATUS_CODE_NOT_FOUND,
  STATUS_CODE_SUCCESS,
} from '../config';
import { ADA_RECEIPT_ADDRESS_INDEX } from '../../wallet-core/src/hd_wallet/Const';
import { ICardanoExplorerTransactionV2, IInputCardanoTX } from './CardanoInterfaces';
const logger = getLogger('AdaGateway');

interface IBlockNumber {
  epoch: number;
  slot: number;
}

interface IDestinationTx {
  amount: number;
  address: string;
}

interface IDestinationTxV2 {
  amount: {
    quantity: number;
    unit: string;
  };
  address: string;
}

interface IWallet {
  wallet_address: string;
  account_id: number;
  backup_phrase: string;
  spending_password: string;
}
GatewayRegistry.registerLazyCreateMethod(CurrencyRegistry.Cardano, () => new CardanoGateway());

export class CardanoGateway extends BaseGateway {
  protected walletAPIEndpoint: string;
  protected explorerAPIEndpoint: string;
  protected authenticationKey: string;

  public constructor() {
    super(CurrencyRegistry.Cardano);
  }

  @override
  public loadCurrencyConfig() {
    const rawConfig = CurrencyRegistry.getCurrencyConfig(this._currency);
    this.authenticationKey = EnvConfigRegistry.getCustomEnvConfig('FROST_KEY');
    try {
      // Config both wallet and explorer APIs in the rest endpoint
      const restEndpoint = JSON.parse(rawConfig.restEndpoint);
      this.walletAPIEndpoint = restEndpoint.walletEndpoint;
      this.explorerAPIEndpoint = restEndpoint.explorerEndpoint;
    } catch (e) {
      // Fallback to old style: rest endpoint is just wallet API, and explorer is a separated config
      this.walletAPIEndpoint = rawConfig.restEndpoint;
      this.explorerAPIEndpoint = rawConfig.explorerEndpoint;
    }
  }

  @implement
  public createAccountAsync(): Promise<Account> {
    throw new Error('Method not implemented.');
  }

  @implement
  public getAccountFromPrivateKey(privateKey: string): Promise<Account> {
    throw new Error('Method not implemented.');
  }

  @implement
  public async signRawTransaction(unsignedRaw: string, secret: string): Promise<ISignedRawTransaction> {
    const coinKeysData = JSON.parse(secret);
    const unsignedData = JSON.parse(unsignedRaw);

    unsignedData.source.accountIndex = Number(coinKeysData.account_id);
    unsignedData.source.walletId = coinKeysData.wallet_address;

    // await this.estimateFee(unsignedData.source.walletId, unsignedData.source.accountIndex, unsignedData.destinations);

    unsignedData.spendingPassword = coinKeysData.spending_password;
    const url = `${this.walletAPIEndpoint}/v2/wallets/${unsignedData.source.walletId}/transactions-sign`;
    const dataBody = {
      passphrase: unsignedData.spendingPassword,
      transaction: unsignedData.txRawData,
    };
    const result = await fetch(url, {
      method: 'post',
      body: JSON.stringify(dataBody),
      headers: { 'Content-Type': 'application/json' },
    });
    if (result.status !== STATUS_CODE_JOB_SUCCESS) {
      throw new Error('Cannot sign tx');
    }
    const dataRaw = await result.json();
    return {
      txid: `TMP_RAWTX_${Date.now()}`,
      unsignedRaw,
      signedRaw: JSON.stringify({ tx: dataRaw.transaction, walletId: unsignedData.source.walletId }),
    };
  }

  /**
   * Check a given address is valid
   *
   * @param address
   */
  public async isValidAddressAsync(address: string): Promise<boolean> {
    // Default just accept all value, need to be implemented on all derived classes
    return true;
    // try {
    //   const url = `${this.explorerAPIEndpoint}/addresses/${address}`;
    //   const result = await this.fetchDataFromFrost(url, {
    //     method: 'get',
    //   });
    //   const resultObj = await result.json();
    //   return resultObj && resultObj.address;
    // } catch (e) {
    //   return false;
    // }
  }

  /**
   * IMPORTANT: Each of wallet from database is corresponding with one account from Cardano wallet server
   * The "walletId" is passed to this method is not increment id from database,
   * but from this: https://cardanodocs.com/technical/wallet/api/v1/#tag/Wallets
   * Backup phrase, spending password and name are parameters for this request:
   * https://cardanodocs.com/technical/wallet/api/v1/#tag/Wallets%2Fpaths%2F~1api~1v1~1wallets%2Fpost
   *
   * @param name
   */
  public async createWallet(name: string): Promise<IWallet> {
    const randomBytes = crypto.randomBytes(32);
    const backupPhrase = bip39.entropyToMnemonic(randomBytes.toString('hex')).split(' ');
    const spendingPassword = crypto.randomBytes(32).toString('hex');

    const bodyWallet = {
      // operation: 'create',
      // assuranceLevel: 'strict',
      name,
      mnemonic_sentence: backupPhrase,
      passphrase: spendingPassword,
      address_pool_gap: 20,
    };

    const urlWallet = `${this.walletAPIEndpoint}/v2/wallets`;
    const walletResponse = await fetch(urlWallet, {
      method: 'post',
      body: JSON.stringify(bodyWallet),
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(walletResponse);

    const walletResult = await walletResponse.json();
    if (walletResponse.status !== 201) {
      logger.error(`AdaGateway::createWallet failed. Info: ${JSON.stringify(walletResult)}`);
      throw new Error(`Could not create wallet on Cardano wallet server.`);
    }
    const walletId = walletResult.id;

    // Then create new account
    const accountId = ADA_RECEIPT_ADDRESS_INDEX; // Fixed accountId
    const urlAccount = `${this.walletAPIEndpoint}/v2/wallets/${walletId}/addresses`;
    const accountResponse = await fetch(urlAccount, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    });

    const accountResult = await accountResponse.json();
    if (accountResponse.status !== 200) {
      logger.error(`AdaGateway::createWallet get account failed. Info: ${JSON.stringify(accountResult)}`);
      throw new Error(`Could not get account on Cardano wallet server.`);
    }
    const mainAccount = accountResult[accountId];

    return {
      wallet_address: walletId,
      account_id: accountId,
      backup_phrase: backupPhrase.join(' '),
      spending_password: spendingPassword,
    };
  }

  /**
   * Create new address in Cardano wallet server
   * See API docs: https://cardanodocs.com/technical/wallet/api/v1/#tag/Addresses%2Fpaths%2F~1api~1v1~1addresses%2Fpost
   *
   * @param walletId
   * @param accountId
   * @param spendingPassword
   * @param backupPhrase
   */
  public async createWalletAddress(
    walletId: string,
    accountIndex: number,
    backupPhrase: string,
    spendingPassword: string
  ): Promise<CardanoAcount> {
    const nameWallet = 'GS-ADA-Wallet-' + crypto.randomBytes(20).toString('hex');
    const newWallet: IWallet = await this.createWallet(nameWallet);
    const urlAddress = `${this.walletAPIEndpoint}/v2/wallets/${newWallet.wallet_address}/addresses`;
    const response = await fetch(urlAddress, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status !== 200) {
      logger.error(`Could not create new ADA address walletId=${newWallet.wallet_address} accountId=${accountIndex}`);
      throw new Error(`Could not create new ADA address.`);
    }

    const address = await response.json();
    return new CardanoAcount({
      address: address[accountIndex].id,
      walletId: newWallet.wallet_address,
      accountId: accountIndex,
      backupPhrase: newWallet.backup_phrase,
      spendingPassword: newWallet.spending_password,
    });
  }

  public async getBlockTransactions(blockHash: string | number): Promise<CardanoTransactions> {
    const url = `${this.explorerAPIEndpoint}/blocks/${blockHash}/txs`;
    const result = await this.fetchDataFromFrost(url, {
      method: 'get',
    });
    const txids = await result.json();

    const txs = await this.getTransactionsByIds(txids);
    return txs as CardanoTransactions;
  }

  public async getBlockCount(): Promise<number> {
    const url = `${this.explorerAPIEndpoint}/blocks/latest`;
    const result = await this.fetchDataFromFrost(url, {
      method: 'get',
    });
    const datas = await result.json();
    return datas.height;
  }

  public async getWalletBalance(walletId: string): Promise<number> {
    const url = `${this.walletAPIEndpoint}/v2/wallets/${walletId}`;
    const result = await fetch(url, {
      method: 'get',
    });
    const datas = await result.json();
    const total = datas.balance.total.quantity;
    return total;
  }

  public async getFirstAddressInWallet(walletId: string): Promise<string> {
    const url = `${this.walletAPIEndpoint}/v2/wallets/${walletId}/addresses`;
    const result = await fetch(url, {
      method: 'get',
    });
    const datas = await result.json();
    return datas[0].id;
  }

  public async getAddressBalance(walletId: string): Promise<BigNumber> {
    const url = `${this.walletAPIEndpoint}/v2/wallets/${walletId}`;
    const result = await fetch(url, {
      method: 'get',
    });
    const response = await result.json();
    return new BigNumber(response.balance.total.quantity);
  }

  public async getChildAddressBalance(address: string): Promise<BigNumber> {
    const url = `${this.explorerAPIEndpoint}/addresses/${address}`;
    const result = await this.fetchDataFromFrost(url, { method: 'get' });
    const response = await result.json();
    // tslint:disable-next-line:triple-equals
    if (response.statusCode == STATUS_CODE_BAD_REQUEST) {
      logger.error(`Could not get address balance of address: ${address}`);
      throw new Error(response.message);
    }
    if (!response || !response.amount) {
      return new BigNumber(0);
    }
    let balance = new BigNumber(0);
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < response.amount.length; i++) {
      if (response.amount[i].unit === NATIVE_UNIT) {
        balance = new BigNumber(response.amount[i].quantity);
        break;
      }
    }
    return balance;
  }

  public async constructRawTransaction(fromWallet: string, vouts: IRawVOut[]): Promise<IRawTransaction> {
    const destinations: IDestinationTxV2[] = [];
    vouts.map(vout => {
      const destination = {
        amount: {
          quantity: Number(vout.amount.toFixed(this._currency.nativeScale)),
          unit: NATIVE_UNIT,
        },
        address: vout.toAddress,
      };
      destinations.push(destination);
    });
    const urlConstruct = `${this.walletAPIEndpoint}/v2/wallets/${fromWallet}/transactions-construct`;
    const dataBody = {
      payments: destinations,
      withdrawal: 'self',
    };
    const result = await fetch(urlConstruct, {
      method: 'post',
      body: JSON.stringify(dataBody),
      headers: { 'Content-Type': 'application/json' },
    });

    if (result.status !== STATUS_CODE_JOB_SUCCESS) {
      throw new Error('Cannot construct tx');
    }
    const dataRaw = await result.json();

    // await this.estimateFee(fromWallet, accountId.toString(), destinations);
    const rawData = {
      groupingPolicy: 'OptimizeForHighThroughput',
      txRawData: dataRaw.transaction,
      withdrawal: 'self',
      source: {
        accountIndex: '',
        walletId: fromWallet,
      },
      spendingPassword: '',
    };

    return {
      txid: `TMP_RAWTX_${Date.now()}`,
      unsignedRaw: JSON.stringify(rawData),
    };
  }

  public async estimateFeeV2(fromWallet: string, vouts: IRawVOut[]): Promise<number> {
    const destinations: IDestinationTxV2[] = [];
    vouts.map(vout => {
      const destination = {
        amount: {
          quantity: Number(vout.amount.toFixed(this._currency.nativeScale)),
          unit: NATIVE_UNIT,
        },
        address: vout.toAddress,
      };
      destinations.push(destination);
    });

    const urlConstruct = `${this.walletAPIEndpoint}/v2/wallets/${fromWallet}/payment-fees`;
    const dataBody = {
      payments: destinations,
      withdrawal: 'self',
    };
    const result = await fetch(urlConstruct, {
      method: 'post',
      body: JSON.stringify(dataBody),
      headers: { 'Content-Type': 'application/json' },
    });

    if (result.status !== STATUS_CODE_JOB_SUCCESS) {
      throw new Error('Cannot construct tx');
    }
    const dataRaw = await result.json();

    return dataRaw.estimated_max.quantity;
  }

  public async signRawTxBySinglePrivateKey(unsignedRaw: string, coinKeys: string): Promise<ISignedRawTransaction> {
    const coinKeysData = JSON.parse(coinKeys);
    const unsignedData = JSON.parse(unsignedRaw);

    unsignedData.source.accountIndex = Number(coinKeysData.account_id);
    unsignedData.source.walletId = coinKeysData.wallet_address;

    await this.estimateFee(unsignedData.source.walletId, unsignedData.source.accountIndex, unsignedData.destinations);

    unsignedData.spendingPassword = coinKeysData.spending_password;
    return {
      txid: `TMP_RAWTX_${Date.now()}`,
      unsignedRaw,
      signedRaw: JSON.stringify(unsignedData),
    };
  }

  public async sendRawTransaction(rawTx: string): Promise<any> {
    const rawData = JSON.parse(rawTx);
    const url = `${this.walletAPIEndpoint}/v2/wallets/${rawData.walletId}/transactions-submit`;
    const dataBody = {
      transaction: rawData.tx,
    };
    const result = await fetch(url, {
      method: 'post',
      body: JSON.stringify(dataBody),
      headers: { 'Content-Type': 'application/json' },
    });
    if (result.status !== STATUS_CODE_JOB_SUCCESS) {
      throw new Error('Cannot send tx');
    }
    const dataRaw = await result.json();
    return {
      txid: dataRaw.id,
    };
  }

  public getAvgFee(): string {
    return '500000';
  }

  public async estimateFee(walletId: string, accountId: string, destinations: IDestinationTx[]): Promise<number> {
    const rawData = {
      groupingPolicy: 'OptimizeForHighThroughput',
      destinations,
      source: {
        accountIndex: Number(accountId),
        walletId,
      },
      spendingPassword: '',
    };
    const urlEstimateFee = `${this.walletAPIEndpoint}/api/v1/transactions/fees`;
    const result = await fetch(urlEstimateFee, {
      method: 'post',
      body: JSON.stringify(rawData),
      headers: { 'Content-Type': 'application/json' },
    });

    const datas = await result.json();

    if (datas.status === 'error') {
      throw new Error(`Error: ${datas.message}`);
    }

    return datas.data.estimatedAmount;
  }

  public async getTransactionStatus(txid: string): Promise<TransactionStatus> {
    const tx = (await this.getOneTransaction(txid)) as CardanoTransaction;
    if (!tx) {
      return TransactionStatus.UNKNOWN;
    }

    if (tx.confirmations < this.getCurrencyConfig().requiredConfirmations) {
      return TransactionStatus.CONFIRMING;
    }

    return TransactionStatus.COMPLETED;
  }

  public async getBlockHash(block: string | number): Promise<string> {
    const url = `${this.explorerAPIEndpoint}/blocks/${block}`;
    const result = await this.fetchDataFromFrost(url, {
      method: 'get',
    });
    const datas = await result.json();
    // tslint:disable-next-line:triple-equals
    if (datas.status_code == STATUS_CODE_NOT_FOUND) {
      return null;
    }
    return datas.hash;
  }

  public async getBlockHashFullInfo(block: string | number): Promise<any> {
    const url = `${this.explorerAPIEndpoint}/blocks/${block}`;
    const result = await this.fetchDataFromFrost(url, {
      method: 'get',
    });
    const datas = await result.json();
    // tslint:disable-next-line:triple-equals
    if (datas.status_code == STATUS_CODE_NOT_FOUND) {
      return null;
    }
    return datas;
  }

  public async getMultiSlotTransactions(fromBlock: number, toBlock: number): Promise<CardanoTransactions> {
    if (fromBlock > toBlock) {
      throw new Error(`fromBlockNumber must be less than toBlockNumber`);
    }
    // tslint:disable-next-line:prefer-const
    let blocks: number[] = [];
    for (let i = fromBlock; i <= toBlock; i++) {
      blocks.push(i);
    }
    const results = new CardanoTransactions();
    await Promise.all(
      blocks.map(async block => {
        const blockHash = await this.getBlockHash(block);
        if (!blockHash) {
          return null;
        }
        const txs = await this.getBlockTransactions(blockHash);
        const transactions = _.compact(txs);
        if (transactions) {
          transactions.forEach((tx: CardanoTransaction) => results.push(tx));
        }
      })
    );
    return results;
  }

  /**
   * minimum fee for seeding in almost case
   */
  public async getAverageSeedingFee(): Promise<BigNumber> {
    throw new Error(`TODO: Implement me.`);
  }

  protected async _getOneBlock(blockNumber: string | number): Promise<Block> {
    const blockHash = await this.getBlockHash(blockNumber);
    if (!blockHash) {
      return null;
    }
    const urlBlock = `${this.explorerAPIEndpoint}/blocks/${blockHash}`;
    const resultBlock = await this.fetchDataFromFrost(urlBlock, {
      method: 'get',
    });
    const datasBlock = await resultBlock.json();

    const urlTxBlock = `${this.explorerAPIEndpoint}/blocks/${blockHash}/txs`;
    const resultTxBlock = await this.fetchDataFromFrost(urlTxBlock, {
      method: 'get',
    });
    const datasTxBlock = await resultTxBlock.json();

    const txids: string[] = datasTxBlock;

    return new Block(
      {
        hash: datasBlock.hash,
        number: Number(blockNumber),
        timestamp: datasBlock.time,
      },
      txids
    );
  }

  protected async _getOneTransaction(txid: string): Promise<CardanoTransaction> {
    const url = `${this.explorerAPIEndpoint}/txs/${txid}/utxos`;
    const results = await this.fetchDataFromFrost(url, {
      method: 'get',
    });
    const datas = await results.json();

    // tslint:disable-next-line:triple-equals
    if (datas.status_code == STATUS_CODE_NOT_FOUND) {
      return null;
    }

    const lastestblock = await this.getBlockCount();

    const urlTx = `${this.explorerAPIEndpoint}/txs/${txid}`;
    const txResults = await this.fetchDataFromFrost(urlTx, {
      method: 'get',
    });
    const txData = await txResults.json();

    // tslint:disable-next-line:triple-equals
    if (txData.status_code == STATUS_CODE_NOT_FOUND) {
      return null;
    }
    const blockNumber = txData.block_height;
    const confirmation = lastestblock - blockNumber;

    const dataBlock = await this.getBlockHashFullInfo(blockNumber);

    const tx: ICardanoExplorerTransactionV2 = {
      hash: txid,
      timestamp: dataBlock.time,
      fees: dataBlock.fees,
      blockHeight: dataBlock.height,
      slot: dataBlock.epoch_slot,
      epoch: dataBlock.epoch,
      blockHash: dataBlock.hash,
      inputs: datas.inputs,
      outputs: datas.outputs,
    };

    return new CardanoTransaction(tx, confirmation);
  }

  private async fetchDataFromFrost(url: RequestInfo, init: RequestInit): Promise<Response> {
    init.headers = {
      ...init.headers,
      ...{
        'Content-Type': 'application/json',
        project_id: this.authenticationKey,
      },
    };
    return fetch(url, init);
  }
}

export default CardanoGateway;
