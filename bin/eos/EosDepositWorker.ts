import 'sota-eos';
import { ICrawlerOptions } from 'sota-common';
import { prepareEnvironment, callbacks } from 'wallet-core';
import { EosCrawler } from 'sota-eos';

prepareEnvironment()
  .then(start)
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

function start(): void {
  const { getLatestCrawledBlockNumber, onCrawlingTxs_CheckUpThreshold, onBlockCrawled } = callbacks;
  const crawlerOpts: ICrawlerOptions = {
    getLatestCrawledBlockNumber,
    onCrawlingTxs: onCrawlingTxs_CheckUpThreshold,
    onBlockCrawled,
  };

  const crawler = new EosCrawler(crawlerOpts);
  crawler.start();
}
