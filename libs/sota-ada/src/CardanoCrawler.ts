import {
  BasePlatformCrawler,
  BlockchainPlatform,
  ICrawlerOptions,
  CurrencyRegistry,
  Utils,
  GatewayRegistry,
  getLogger,
} from 'sota-common';
import { CardanoGateway } from './CardanoGateway';
const logger = getLogger('BasePlatformCrawler');

export class CardanoCrawler extends BasePlatformCrawler {
  constructor(options: ICrawlerOptions) {
    super(BlockchainPlatform.Cardano, options);
  }
  public async processBlocks(fromBlock: number, toBlock: number, latestNetworkBlock: number): Promise<void> {
    const allCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(this._nativeCurrency.platform);
    await Utils.PromiseAll(
      allCurrencies.map(async c => {
        const currency = c.symbol;
        const gateway = GatewayRegistry.getGatewayInstance(c);

        // Get all transactions in the block

        // Use callback to process all crawled transactions

        logger.info(`${currency}::processBlocks BEGIN: ${fromBlock} → ${toBlock} / ${latestNetworkBlock}`);
        console.log(`${currency}::processBlocks BEGIN: ${fromBlock} → ${toBlock} / ${latestNetworkBlock}`);

        // Get all transactions in the block
        const allTxs = await (gateway as CardanoGateway).getMultiSlotTransactions(fromBlock, toBlock);
        console.log(allTxs);
        await this._options.onCrawlingTxs(this, allTxs);

        // Use callback to process all crawled transactions
        logger.info(`${currency}::_processBlocks FINISH: ${fromBlock} → ${toBlock}, txs=${allTxs.length}`);
      })
    );
  }
}

export default CardanoCrawler;
