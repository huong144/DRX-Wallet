import * as _ from 'lodash';
import { TransferEntry, BlockHeader, CurrencyRegistry, Transaction, BigNumber, implement, override } from 'sota-common';
import {
  ICardanoExplorerTransaction,
  ICardanoExplorerAmount,
  ICardanoExplorerTransactionV2,
  IInputCardanoTX,
  IOutputCardanoTX,
} from './CardanoInterfaces';
import { NATIVE_UNIT } from '../config';

export class CardanoTransaction extends Transaction {
  public readonly vIns: TransferEntry[];
  public readonly vOuts: TransferEntry[];
  public readonly epoch: number;
  public readonly slot: number;
  public readonly netFee: BigNumber;

  constructor(tx: ICardanoExplorerTransactionV2, confirmations: number) {
    const currency = CurrencyRegistry.Cardano;
    const txProps = {
      txid: tx.hash,
      confirmations,
      timestamp: tx.timestamp,
      height: tx.blockHeight,
    };

    const block = new BlockHeader({
      hash: tx.blockHash,
      number: tx.blockHeight,
      timestamp: tx.timestamp,
    });

    super(currency, txProps, block);

    this.epoch = tx.epoch;
    this.slot = tx.slot;
    this.netFee = new BigNumber(tx.fees);
    this.vIns = tx.inputs.map(this._convertInputToTransferEntry.bind(this));
    this.vOuts = tx.outputs.map(this._convertOutputToTransferEntry.bind(this));
  }

  @implement
  public _extractEntries(): TransferEntry[] {
    const allEntries = this.vIns.concat(this.vOuts);
    return TransferEntry.mergeEntries(allEntries);
  }

  @implement
  public getNetworkFee(): BigNumber {
    return this.netFee;
  }

  @override
  public getExtraDepositData(): any {
    return Object.assign({}, super.getExtraDepositData(), {
      epoch: this.epoch,
      slot: this.slot,
    });
  }

  protected _convertInputToTransferEntry(input: IInputCardanoTX): TransferEntry {
    let balance = '0';
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < input.amount.length; i++) {
      if (input.amount[i].unit === NATIVE_UNIT) {
        balance = input.amount[i].quantity;
        break;
      }
    }
    return {
      currency: this.currency,
      amount: new BigNumber(`-${balance}`),
      address: input.address,
      tx: this,
      txid: this.txid,
    };
  }

  protected _convertOutputToTransferEntry(input: IOutputCardanoTX): TransferEntry {
    let balance = '0';
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < input.amount.length; i++) {
      if (input.amount[i].unit === NATIVE_UNIT) {
        balance = input.amount[i].quantity;
        break;
      }
    }
    return {
      currency: this.currency,
      amount: new BigNumber(balance),
      address: input.address,
      tx: this,
      txid: this.txid,
    };
  }
}

export default CardanoTransaction;
