import { EosGateway } from '../../../src/EosGateway';
import assert from 'assert';
import { callbacks } from 'wallet-core';
import { Currency } from 'sota-common';

describe('checkAccount', () => {
  it('check EOS account', async () => {
    callbacks
      .prepareCurrencyWorker(Currency.EOS, 'eos')
      .then(testCheckAccount)
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  });
});

async function testCheckAccount() {
  const gateway = EosGateway.getInstance();
  const account: boolean = await gateway.isValidAddressAsync('yuubaniraima');
  assert(account);
  const failAccount: boolean = await gateway.isValidAddressAsync('yuubaniraimaasa');
  assert.equal(failAccount, false);
}
