import 'sota-ada';
import { ICrawlerOptions } from 'sota-common';
import { prepareEnvironment, callbacks } from 'wallet-core';
import { CardanoCrawler } from 'sota-ada';

prepareEnvironment()
  .then(start)
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

function start(): void {
  const { getLatestCrawledBlockNumber, onCrawlingTxs, onBlockCrawled, onCrawlingTxs_CheckUpThreshold } = callbacks;
  const crawlerOpts: ICrawlerOptions = {
    getLatestCrawledBlockNumber,
    onCrawlingTxs: onCrawlingTxs_CheckUpThreshold,
    onBlockCrawled,
  };

  const crawler = new CardanoCrawler(crawlerOpts);
  crawler.start();
}
