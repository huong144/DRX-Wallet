import {
  Block,
  Transaction,
  Transactions,
  TransactionStatus,
  IRawTransaction,
  ISignedRawTransaction,
  Account,
  override,
  getLogger,
  AccountBasedGateway,
  IEosToken,
  CurrencyRegistry,
  GatewayRegistry,
  BigNumber,
  implement,
  Utils,
} from 'sota-common';
import { TextEncoder, TextDecoder } from 'util';
import { Api as EOSApi, JsonRpc as EOSJsonRpc } from 'eosjs';
import { EosStatuses, EosTransaction } from './EosTransaction';
import { GetInfoResult } from 'eosjs/dist/eosjs-rpc-interfaces';
import JsSignatureProvider from 'eosjs/dist/eosjs-jssig';
import { createHash } from 'crypto';

const logger = getLogger('EosGateway');

CurrencyRegistry.onEOSTokenRegistered((token: IEosToken) => {
  GatewayRegistry.registerLazyCreateMethod(token, () => new EosGateway(token));

  if (token.networkSymbol.toLowerCase() === 'eos') {
    GatewayRegistry.registerLazyCreateMethod(CurrencyRegistry.EOS, () => new EosGateway(token));
  }
});

export class EosGateway extends AccountBasedGateway {
  public static apiEos: EOSApi;
  protected _currency: IEosToken;

  public constructor(currency: IEosToken) {
    super(currency);

    if (!EosGateway.apiEos) {
      this.setApi([]); // default private key is []
    }
  }

  /**
   * Append key providers to api, do not remove it
   * @param keys
   */
  public setApi(keys: string[]) {
    const signs = new JsSignatureProvider(keys);
    const fetch = require('node-fetch');
    const restApiEndpoint = this.getCurrencyConfig().restEndpoint;
    const rpc = new EOSJsonRpc(restApiEndpoint, { fetch });
    EosGateway.apiEos = new EOSApi({
      rpc,
      signatureProvider: signs,
      textDecoder: new TextDecoder() as any,
      textEncoder: new TextEncoder() as any,
    });
  }

  /**
   * Generate account associate with exchange wallet
   */
  public async createAccountAsync(): Promise<Account> {
    throw new Error(`We don't have method to auto-create EOS account for now.`);
  }

  public async getAccountFromPrivateKey(privateKey: string): Promise<Account> {
    throw new Error(`TODO: Implementme`);
  }

  /**
   * Check a given address is valid
   *
   * @param address
   */
  public async isValidAddressAsync(address: string): Promise<boolean> {
    try {
      const account = await EosGateway.apiEos.rpc.get_account(address);
      return !!account;
    } catch (e) {
      logger.error(e);
      return false;
    }
  }

  /**
   * getAddressBalance from network (for eos and eos tokens)
   * @param address
   */
  @implement
  public async getAddressBalance(address: string): Promise<BigNumber> {
    const code = this._currency.code;
    const symbol = this._currency.networkSymbol;
    const account = await EosGateway.apiEos.rpc.get_currency_balance(code, address, symbol);
    logger.debug(`getAddressBalance code=${code} address=${address} symbol=${symbol} info=${JSON.stringify(account)}`);
    // Seems account is invalid or not registered
    if (!account || !account.length) {
      return new BigNumber(0);
    }

    const rawBalanceFormat = account[0];
    const separator = ' ';
    const balanceF = rawBalanceFormat.toString().split(separator) as string[];
    return new BigNumber(balanceF[0]);
  }

  /**
   * getBlockCount from network
   */
  public async getBlockCount(): Promise<number> {
    const latestBlock = await EosGateway.apiEos.rpc.get_info();
    return new BigNumber(latestBlock.head_block_num).minus(60).toNumber();
  }

  /**
   * getBlockHash from network
   * @param height
   */
  public async getBlockHash(height: number): Promise<string> {
    const block = await EosGateway.apiEos.rpc.get_block(height);
    return block.id as string;
  }

  /**
   * getOneBlock from network
   * @param blockHash
   */
  public async _getOneBlock(blockHash: string | number): Promise<Block> {
    const blockResponse = await EosGateway.apiEos.rpc.get_block(blockHash);
    const blockObj = JSON.parse(JSON.stringify(blockResponse));
    const txs = blockObj.transactions;
    const txids: string[] = [];
    txs.map((tx: { status: any; trx: { id: string } }) => {
      if (tx.status === EosStatuses.executed) {
        txids.push(tx.trx.id);
      }
    });

    const block: Block = {
      hash: blockResponse.id,
      number: blockResponse.block_num,
      timestamp: new Date(blockResponse.timestamp).getTime() / 1000,
      txids,
    };

    return block;
  }

  /**
   * getOneTransaction from network
   * with EOS, an error will be thrown if no transaction was found
   * failed transaction have a string trx property
   * @param txid
   * @param block_num
   */
  public async _getOneTransaction(txid: string): Promise<Transaction> {
    let transaction;
    try {
      transaction = await EosGateway.apiEos.rpc.history_get_transaction(txid);
    } catch (e) {
      getLogger('EosGateway').warn(e.toString());
      return null;
    }

    const block = await EosGateway.apiEos.rpc.get_block(transaction.block_num);
    const info = await EosGateway.apiEos.rpc.get_info();
    if (!transaction || !transaction.trx || !transaction.trx.receipt) {
      return null;
    }

    const listAction = [];
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < transaction.traces.length; i++) {
      listAction.push(transaction.traces[i].act);
    }

    let tx: any = null;
    if (transaction.trx.receipt.status === EosStatuses.failed) {
      tx = {
        status: EosStatuses.failed,
        trx: null,
      };
    } else {
      tx = {
        status: EosStatuses.executed,
        trx: {
          id: transaction.id,
          transaction: {
            actions: listAction,
          },
        },
      };
    }

    return new EosTransaction(tx, block, info.last_irreversible_block_num, this._currency);
  }

  /**
   * Check whether a transaction is finalized on blockchain network
   * @param {string} txid: the hash/id of transaction need to be checked
   * @returns {string}: the tx status
   */
  public async getTransactionStatus(txid: string): Promise<TransactionStatus> {
    const chainInfo = await this.getChainInfo();
    const foundTransaction = await this.getOneTransaction(txid);
    if (foundTransaction) {
      if (foundTransaction.isFailed) {
        return TransactionStatus.FAILED;
      }
      return foundTransaction.height <= chainInfo.last_irreversible_block_num
        ? TransactionStatus.COMPLETED
        : TransactionStatus.CONFIRMING;
    } else {
      return TransactionStatus.UNKNOWN;
    }
  }

  /**
   * sendRawTransaction func() will broadcast transaction to network
   * @param rawTx under Uint8Array
   * @param signatures
   */
  public async sendRawTransaction(rawTx: any): Promise<any> {
    const obj = JSON.parse(rawTx);
    const signatures = obj.signatures;
    const stringValue = obj.serializedTransaction;
    const bytes = new Uint8Array(Math.ceil(stringValue.length / 2));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(stringValue.substr(i * 2, 2), 16);
    }

    const result = await EosGateway.apiEos.rpc
      .push_transaction({
        serializedTransaction: bytes,
        signatures,
      })
      .then(data => {
        return data;
      })
      .catch(err => {
        console.log(err);
        throw err;
      });
    return {
      txid: result.transaction_id,
      blockNumber: result.processed.block_num,
    };
  }

  /**
   * signTransaction and not broadcast this created transaction
   */
  public async signTransaction(): Promise<any> {
    const chainInfo = await this.getChainInfo();
    const irrBlock = await EosGateway.apiEos.rpc.get_block(chainInfo.last_irreversible_block_num);
    const expiration = new Date(new Date(chainInfo.head_block_time + 'Z').getTime() + 1800 * 1000)
      .toISOString()
      .split('.')[0];

    const result = await EosGateway.apiEos.transact(
      {
        actions: [
          {
            account: 'eosio.token',
            authorization: [
              {
                actor: 'yuubaniraima',
                permission: 'active',
              },
            ],
            data: {
              from: 'yuubaniraima',
              memo: 'hihi',
              quantity: '100.0000 EOS',
              to: 'eosasia11111',
            },
            name: 'transfer',
          },
        ],
        expiration,
        ref_block_num: chainInfo.last_irreversible_block_num & 0xffff,
        ref_block_prefix: irrBlock.ref_block_prefix,
      },
      { broadcast: false, expireSeconds: 600 }
    );

    return result;
  }

  /**
   * create raw transaction
   * @param fromAddress
   * @param vouts
   */
  public async constructRawTransaction(
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    options: {
      isConsolidate?: boolean;
      destinationTag?: string;
    }
  ): Promise<IRawTransaction> {
    const chainInfo = await this.getChainInfo();
    const irrBlock = await EosGateway.apiEos.rpc.get_block(chainInfo.last_irreversible_block_num);
    const expiration = new Date(new Date(chainInfo.head_block_time + 'Z').getTime() + 1800 * 1000)
      .toISOString()
      .split('.')[0];

    if (options.destinationTag === null || options.destinationTag === undefined) {
      options.destinationTag = '';
    }

    const serializedAction = await EosGateway.apiEos.serializeActions([
      {
        account: this._currency.code,
        authorization: [
          {
            actor: fromAddress,
            permission: 'active',
          },
        ],
        data: {
          from: fromAddress,
          memo: options.destinationTag.toString() || '',
          quantity: amount.toFixed(this._currency.nativeScale) + ' ' + this._currency.networkSymbol.toUpperCase(),
          to: toAddress,
        },
        name: 'transfer',
      },
    ]);

    const transaction = {
      actions: serializedAction,
      expiration,
      ref_block_num: (chainInfo.last_irreversible_block_num & 0xffff).valueOf(),
      ref_block_prefix: irrBlock.ref_block_prefix.toString(),
    };

    const serialized = EosGateway.apiEos.serializeTransaction(transaction);
    const rawTx = Buffer.from(serialized).toString('hex');

    return {
      txid: 'TMP_EOS_' + Utils.nowInMillis(),
      unsignedRaw: rawTx,
    };
  }

  public async signRawTransaction(hexRawTx: string, secret: string): Promise<ISignedRawTransaction> {
    const eosKeys: string[] = [];
    try {
      const eosKeysObj = JSON.parse(secret);
      if (eosKeysObj.ownerKey) {
        eosKeys.push(eosKeysObj.ownerKey);
      }
      if (eosKeysObj.activeKey) {
        eosKeys.push(eosKeysObj.activeKey);
      }
    } catch (e) {
      // secret is not object type, just use secret string as raw key
      eosKeys.push(secret);
    }

    this.setApi(eosKeys);

    const stringValue = hexRawTx;
    const bytes = new Uint8Array(Math.ceil(stringValue.length / 2));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(stringValue.substr(i * 2, 2), 16);
    }
    const transaction = EosGateway.apiEos.deserializeTransaction(bytes);
    const deserializedActions = await EosGateway.apiEos.deserializeActions(transaction.actions);

    transaction.actions = deserializedActions;
    const result = await EosGateway.apiEos.transact(transaction, {
      broadcast: false,
      expireSeconds: 600,
    });

    // convert uInt18 to hex string
    const pad = (n: string, width: number, z = '0') => {
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    };

    const hexRawTx2 = Array.from(Uint8Array.from(result.serializedTransaction))
      .map(v => pad(v.toString(16), 2))
      .join('');

    const transactionId = createHash('sha256')
      .update(Uint8Array.from(result.serializedTransaction))
      .digest()
      .toString('hex');

    return {
      txid: transactionId,
      signedRaw: JSON.stringify({
        serializedTransaction: hexRawTx2,
        signatures: result.signatures,
      }),
      unsignedRaw: hexRawTx,
    };
  }

  /**
   * getChainInfo from network
   */
  public async getChainInfo(): Promise<GetInfoResult> {
    const chainInfo = await EosGateway.apiEos.rpc.get_info();
    return chainInfo;
  }

  /**
   * getBlockTransactions from network
   * @param blockHash
   */
  @override
  public async getBlockTransactions(blockNumber: string | number): Promise<Transactions> {
    const origin = await EosGateway.apiEos.rpc.get_block(blockNumber);
    const rawTxs: any[] = (origin as any).transactions;
    const handledTxs = new Transactions();
    const latestBlock = await this.getBlockCount();
    await Promise.all(
      rawTxs.map(tx => {
        if (
          tx.hasOwnProperty('trx') &&
          tx.trx.hasOwnProperty('transaction') &&
          tx.trx.transaction.hasOwnProperty('actions')
        ) {
          const tx4 = new EosTransaction(tx, origin, latestBlock, this._currency);
          handledTxs.push(tx4);
        }
      })
    );
    return handledTxs;
  }

  /**
   * minimum fee for seeding in almost case
   */
  public async getAverageSeedingFee(): Promise<BigNumber> {
    throw new Error(`TODO: Implement me.`);
  }
}

export default EosGateway;
