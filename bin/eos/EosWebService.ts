import { EosWebServer, EosGateway } from 'sota-eos';
import util from 'util';
import { getLogger, Utils } from 'sota-common';
import * as bodyParser from 'body-parser';
import { prepareEnvironment, hd } from 'wallet-core';
import { getConnection } from 'wallet-core/node_modules/typeorm';
import { BlockchainPlatform, CurrencyRegistry, TokenType } from '../../libs/sota-common';
import { EOS_TOKEN } from '../../libs/wallet-core/src/hd_wallet/Const';

const logger = getLogger('EosWebService');

prepareEnvironment()
  .then(start)
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

function start(): void {
  const worker = new GSEosWebServer();
  worker.start();
}

class GSEosWebServer extends EosWebServer {
  /**
   * createAddress
   */

  public async createNewAddress(req: any, res: any) {
    const coin: string = req.params.currency.toString();
    const currency = CurrencyRegistry.getOneCurrency(coin).platform;
    await getConnection().transaction(async manager => {
      const hotWallet = await hd.findHotWalletWithoutAddress(currency, manager);
      if (!hotWallet || !hotWallet.address) {
        return res
          .status(400)
          .json({ error: `Do not have hot wallet for this currency: ${coin}, please add address!` });
      }
      return res.json({ address: hotWallet.address });
    });
  }

  public async approveTransaction(req: any, res: any) {
    const [toAddress, memo] = req.body.toAddress.toString().split('|');
    const amount: number = req.body.amount;
    const coin: string = req.params.currency.toString();
    const currency = CurrencyRegistry.getOneCurrency(coin).platform;
    if (!(await hd.validateAddress(currency, toAddress))) {
      return res.status(400).json({ error: 'Invalid address!' });
    }
    try {
      await getConnection().transaction(async manager => {
        const response = await hd.approveTransaction(manager, coin, toAddress, amount, memo);
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

  public async addAddress(req: any, res: any) {
    let coin: string = req.params.currency.toString();
    const address = req.body.address;
    const privateKey = req.body.private_key;
    let formatPrivateKey = privateKey;
    coin = CurrencyRegistry.getOneCurrency(coin).platform;
    if (typeof formatPrivateKey === 'string') {
      formatPrivateKey = JSON.parse(formatPrivateKey);
    }
    if (!formatPrivateKey.ownerKey || !formatPrivateKey.activeKey) {
      throw new Error(`Private key of ${coin} need activeKey and ownerKey`);
    }
    await getConnection().transaction(async manager => {
      await hd.addAddressOneAddressCurrency(coin, address, JSON.stringify(formatPrivateKey), manager);
      return res.json('ok');
    });
  }

  public handleCurrency(req: any, res: any, next: any) {
    const coin = req.params.currency;
    if (!coin || !coin.startsWith(TokenType.EOS)) {
      return res.status(400).json({ error: 'Incorrect currency!' });
    }
    if (coin === BlockchainPlatform.EOS) {
      req.params.currency = EOS_TOKEN;
    }
    return next();
  }

  protected setup() {
    super.setup();
    this.app.use(bodyParser.json());
    // api create addresses
    this.app.post('/api/:currency/address', this.handleCurrency, async (req, res) => {
      try {
        await this.createNewAddress(req, res);
      } catch (e) {
        logger.error(`createNewAddress err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
    // api insert db to pick
    this.app.post('/api/:currency/withdrawal/approve', this.handleCurrency, async (req, res) => {
      try {
        await this.approveTransaction(req, res);
      } catch (e) {
        logger.error(`approve err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
    this.app.post('/api/:currency/setting_threshold', this.handleCurrency, async (req, res) => {
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
    this.app.get('/api/:currency/statistical_hotwallet', this.handleCurrency, async (req, res) => {
      try {
        await this.getStatistical(req, res);
      } catch (e) {
        logger.error(`statistical_hotwallet err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
    this.app.post('/api/:currency/add_address', this.handleCurrency, async (req, res) => {
      try {
        await this.addAddress(req, res);
      } catch (e) {
        logger.error(`add address err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
  }
}
