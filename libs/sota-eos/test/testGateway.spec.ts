import { EosGateway } from '../src/EosGateway';

describe('test_get_block_count', () => {
  it('should get block count', done => {
    const eos = EosGateway.getInstance();
    eos
      .getBlockCount()
      .then(number => {
        console.log('Block count ', number);
        done();
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  });
});

describe('test_get_transaction', () => {
  it('should get transaction', () => {
    const eos = EosGateway.getInstance();
  });
});

describe('test_sign', () => {
  it('should sign', function(done) {
    // @ts-ignore
    this.timeout(30000);
    const eos = EosGateway.getInstance();
    eos
      .signTransaction()
      .then(data => {
        console.log(data);
        done();
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  });
});

/*describe('test_send', () => {
  it('should send', function(done) {
    // @ts-ignore
    this.timeout(30000);
    const eos = EosGateway.getInstance();

    eos
      .signTransaction()
      .then(dataSigned => {
        console.log(dataSigned.signatures);

        const serializedTransactionObj = JSON.parse(JSON.stringify(dataSigned.serializedTransaction));
        const serializedTransaction = Array.from(
          Object.keys(serializedTransactionObj),
          k => serializedTransactionObj[k]
        );
        const dataParse = Uint8Array.from(serializedTransaction);
        const a = EosGateway.getInstance()
          .getApi()
          .deserializeTransaction(dataSigned.serializedTransaction);

        eos
          .sendRawTransaction(dataParse as any, dataSigned.signatures as string[])
          .then(data => {
            console.log(data);
            done();
          })
          .catch(err => {
            console.log(err);
            done(err);
          });
      })
      .catch(err => {
        console.log(err);
      });
  });
});*/

describe('test_get_block', () => {
  it('should get block', done => {
    const eos = EosGateway.getInstance();
    eos
      .getOneBlock(2339071)
      .then(block => {
        done();
        console.log('Block: ', JSON.stringify(block));
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  });
});

describe('test_get_block_hash', () => {
  it('should return hash', done => {
    const eos = EosGateway.getInstance();
    eos
      .getBlockHash(2339071)
      .then(hash => {
        console.log('Block hash ' + JSON.stringify(hash));
        done();
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  });
});

describe('test_get_block_transaction', () => {
  it('should 1.1', function(done) {
    // @ts-ignore
    this.timeout(30000);
    const eos = EosGateway.getInstance();
    eos
      .getBlockTransactions(8973519)
      .then(txs => {
        console.log('Block txs: ' + JSON.stringify(txs));
        done();
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  });
});

describe('test_get_block_transaction_for_token', () => {
  it('should get transaction for token YUU', function(done) {
    // @ts-ignore
    this.timeout(30000);
    const eos = EosGateway.getInstance({
      interactAddress: 'yuubaniraima',
      investigatedAddresses: null,
    });
    eos
      .getBlockTransactions(8973703)
      .then(txs => {
        console.log('Block txs: ' + JSON.stringify(txs));
        done();
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  });
});

describe('test_get_multi_blocks_transaction', () => {
  it('should get multi txs', function(done) {
    // @ts-ignore
    this.timeout(30000);
    const eos = EosGateway.getInstance();
    eos
      .getMultiBlocksTransactions(2339071, 2339091)
      .then(txs => {
        console.log('Multi blocks txs: ' + JSON.stringify(txs));
        done();
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  });
});

describe('test_get_account_balance', () => {
  it('should get balance', done => {
    const eos = EosGateway.getInstance();
    eos
      .getAddressBalance('yuubaniraima')
      .then(account => {
        console.log('Account balance: ' + JSON.stringify(account));
        done();
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  });
});

describe('test_get_account_token_balance', () => {
  it('should get token balance', done => {
    const eos = EosGateway.getInstance({
      interactAddress: 'yuubaniraima',
      investigatedAddresses: null,
    });
    eos
      .getAddressBalance('yuubaniraima')
      .then(account => {
        console.log('Account balance: ' + JSON.stringify(account));
        done();
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  });
});

describe('test_get_transaction eos', () => {
  it('should get transaction eos', function(done) {
    // @ts-ignore
    this.timeout(30000);
    const eos = EosGateway.getInstance();
    eos
      .getOneTransaction('105b04b031ea35d7c24f8faaf6b203707ac469ad6476b4c79f95e55d1a8651e7')
      .then(data => {
        data.extractTransferOutputs();
        console.log(JSON.stringify(data));
        done();
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  });
});

describe('test_get_transaction_with_no_block_hint', () => {
  it('should get transaction with no hint', done => {
    const eos = EosGateway.getInstance();
    eos
      .getOneTransaction('b054fa81104b75bb6a1a058178117119e3239d524ca951cd41820591c12e7dd3')
      .then(data => {
        console.log(JSON.stringify(data));
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  });
});
