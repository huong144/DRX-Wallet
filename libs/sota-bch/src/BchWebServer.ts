import { BaseWebServer, BlockchainPlatform, override, getLogger } from 'sota-common';
import BchGateway from './BchGateway';

export class BchWebServer extends BaseWebServer {
  public constructor() {
    super(BlockchainPlatform.BitcoinCash);
  }
  @override
  protected async validateAddress(req: any, res: any) {
    const { address } = req.params;
    const isValid = await this.getGateway(this._currency.symbol).isValidAddressAsync(address);
    if (!isValid) {
      return res.json({ isValid });
    }
    return res.json(
      Object.assign({ isValid }, (this.getGateway(this._currency.symbol) as BchGateway).getTypesAddress(address))
    );
  }
}
