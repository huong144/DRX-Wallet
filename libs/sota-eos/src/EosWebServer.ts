import { BaseWebServer, BlockchainPlatform } from 'sota-common';

export class EosWebServer extends BaseWebServer {
  public constructor() {
    super(BlockchainPlatform.EOS);
  }
}
