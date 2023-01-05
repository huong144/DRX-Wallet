import { CardanoGateway, CardanoWebServer } from 'sota-ada';
import util from 'util';
import { getLogger, BlockchainPlatform } from 'sota-common';
import * as bodyParser from 'body-parser';
import { prepareEnvironment, hd } from 'wallet-core';
import { getConnection } from 'wallet-core/node_modules/typeorm';

const logger = getLogger('AdaWebService');

prepareEnvironment()
  .then(start)
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

function start(): void {
  const worker = new GSAdaWebServer();
  worker.start();
}

class GSAdaWebServer extends CardanoWebServer {
  /**
   * createAddress
   */
  public async createNewAddress(req: any, res: any) {
    const amount = req.body.amount || 1;
    const coin: string = req.params.currency.toString();
    if (coin !== 'ada') {
      return res.status(400).json({ error: 'Incorrect currency!' });
    }
    const currency = coin;
    try {
      await getConnection().transaction(async manager => {
        const addresses = await hd.createAdaAddresses(amount, currency, manager);
        console.log(addresses);
        if (!addresses.length) {
          return res.status(400).json({ error: 'Do not have HD wallet for this currency' });
        }
        res.json(addresses);
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.toString() });
    }
  }

  public async approveTransaction(req: any, res: any) {
    const toAddress: string = req.body.toAddress;
    const amount: number = req.body.amount;
    const coin: string = req.params.currency.toString();
    if (coin !== 'ada') {
      return res.status(400).json({ error: 'Incorrect currency!' });
    }
    try {
      await getConnection().transaction(async manager => {
        const response = await hd.approveTransaction(manager, coin, toAddress, amount);
        if (!response) {
          res.status(500).json({ error: 'Fail!' });
        }
        return res.json({ id: response });
      });
    } catch (e) {
      res.status(400).json({ error: e.toString() });
    }
  }

  public async settingThreshold(req: any, res: any) {
    const upperThreshold = req.body.upperThreshold;
    const lowerThreshold = req.body.lowerThreshold;
    const address = req.body.address;
    const currency = req.params.currency;
    await getConnection().transaction(async manager => {
      await hd.saveThreshold(currency, address, upperThreshold, lowerThreshold, manager);
    });
    return res.json('ok');
  }

  public async getSettingThreshold(req: any, res: any) {
    let list;
    await getConnection().transaction(async manager => {
      list = await hd.getSettingThreshold(manager);
    });
    return res.json(list);
  }

  public async settingMailer(req: any, res: any) {
    const mailerReceive = req.body.mailerReceiver;
    await getConnection().transaction(async manager => {
      await hd.saveMailerReceive(mailerReceive, manager);
    });
    return res.json('ok');
  }

  public async getStatistical(req: any, res: any) {
    let list;
    const coin: string = req.params.currency.toString();
    await getConnection().transaction(async manager => {
      list = await hd.statisticalHotWallet(coin, manager);
    });
    return res.json(list);
  }

  protected setup() {
    super.setup();
    this.app.use(bodyParser.json());
    // api create addresses
    this.app.post('/api/:currency/address', async (req, res) => {
      try {
        await this.createNewAddress(req, res);
      } catch (e) {
        logger.error(`createNewAddress err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
    // api create withdrawl record
    this.app.post('/api/:currency/withdrawal/approve', async (req, res) => {
      try {
        await this.approveTransaction(req, res);
      } catch (e) {
        logger.error(`approve err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
    this.app.post('/api/:currency/setting_threshold', async (req, res) => {
      try {
        await this.settingThreshold(req, res);
      } catch (e) {
        logger.error(`setting threshold err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
    this.app.post('/api/setting_mailer', async (req, res) => {
      try {
        await this.settingMailer(req, res);
      } catch (e) {
        logger.error(`approve err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
    this.app.get('/api/setting_threshold', async (req, res) => {
      try {
        await this.getSettingThreshold(req, res);
      } catch (e) {
        logger.error(`approve err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
    this.app.get('/api/:currency/statistical_hotwallet', async (req, res) => {
      try {
        await this.getStatistical(req, res);
      } catch (e) {
        logger.error(`statistical_hotwallet err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
  }
}
