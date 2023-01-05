import { BasePlatformCrawler, BlockchainPlatform, ICrawlerOptions } from 'sota-common';

export class EosCrawler extends BasePlatformCrawler {
  constructor(options: ICrawlerOptions) {
    super(BlockchainPlatform.EOS, options);
  }
}

export default EosCrawler;
