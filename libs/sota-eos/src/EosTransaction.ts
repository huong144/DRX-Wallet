import { GetBlockResult } from 'eosjs/dist/eosjs-rpc-interfaces';
import { BlockHeader, IEosToken, AccountBasedTransaction, BigNumber } from 'sota-common';

const EosStatuses = {
  executed: 'executed',
  failed: 'soft_fail',
};

class EosTransaction extends AccountBasedTransaction {
  public readonly fromAddress: string;
  public readonly toAddress: string;
  public readonly amount: BigNumber;
  public readonly txid: string;
  public readonly memo: string;
  public readonly actions: any[];
  public readonly currency: IEosToken;

  constructor(tx: any, block: GetBlockResult, lastNetworkBlock: number, currency: IEosToken) {
    let fromAddress: string = null;
    let toAddress: string = null;
    let amount: BigNumber = new BigNumber(0);
    let memo: string = null;
    let actions: any[] = [];
    if (tx.trx) {
      actions = tx.trx.transaction ? tx.trx.transaction.actions : [];
    }

    if (actions.length) {
      actions.map(action => {
        if (
          action.name === 'transfer' &&
          action.account === currency.code &&
          action.data.hasOwnProperty('memo') &&
          action.data.hasOwnProperty('from') &&
          action.data.hasOwnProperty('to') &&
          action.data.hasOwnProperty('quantity')
        ) {
          fromAddress = action.data.from;
          toAddress = action.data.to as string;
          memo = action.data.memo;
          amount = new BigNumber(this._quantityStringToAmount(action.data.quantity));
          return;
        }
      });
    }

    const txProps = {
      confirmations: lastNetworkBlock ? lastNetworkBlock - block.block_num + 1 : 0,
      height: block.block_num,
      timestamp: new Date(block.timestamp).getTime() / 1000,
      txid: tx.trx.id,
      fromAddress,
      toAddress,
      amount,
    };

    const blockHeader = new BlockHeader({
      hash: block.id,
      number: block.block_num,
      timestamp: new Date(block.timestamp).getTime() / 1000,
    });

    super(currency, txProps, blockHeader);
    this.isFailed = tx.status === EosStatuses.failed;
    this.memo = memo;
  }

  public getNetworkFee(): BigNumber {
    return new BigNumber(0);
  }

  public extractAdditionalField(): any {
    return {
      memo: this.memo,
    };
  }

  private _quantityStringToAmount(eosQuantity: string): string {
    const txAmountArr = eosQuantity.split(' ');
    return txAmountArr[0];
  }
}

export { EosTransaction, EosStatuses };
