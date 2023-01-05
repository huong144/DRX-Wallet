import { BaseWebServer, BlockchainPlatform } from 'sota-common';

export class CardanoWebServer extends BaseWebServer {
  public constructor() {
    super(BlockchainPlatform.Cardano);
  }
}
