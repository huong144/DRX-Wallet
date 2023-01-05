import { EosGateway } from '../../../src/EosGateway';
import assert from 'assert';

const gateway = EosGateway.getInstance();

describe('createAccount', () => {
  it('should generate random account eos', async () => {
    const account = gateway.createAccount();
    assert(account.address.length > 0);
  });
});
