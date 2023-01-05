// import * as _ from 'lodash';
// import * as mysql from 'mysql';
// import fetch from 'node-fetch';
// import { prepareCommonWorker } from 'wallet-core/src/callbacks/active/prepareWorker';
// import { Kms } from 'wallet-core/src/encrypt/Kms';

// const con = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '1',
//   database: 'exchange_wallet',
// });

// // let data;
// const explorer = `http://192.168.1.204:8090`;

// con.connect(async err => {
//   if (err) {
//     throw err;
//   }
//   console.log('Connected!');
//   await prepareCommonWorker();
//   con.query('SELECT * FROM ada_address', async (error, results, fields) => {
//     if (error) {
//       throw err;
//     }
//     const task = _.map(results, async data => {
//       const passPhrase = data.backup_phrase.split(' ');
//       let spendingPass = data.spending_password;
//       if (data.kms_data_key_id === 1) {
//         spendingPass = await Kms.getInstance().decrypt(spendingPass, data.kms_data_key_id);
//       }
//       const body = {
//         operation: 'restore',
//         backupPhrase: passPhrase,
//         assuranceLevel: 'strict',
//         name: 'Sotatek wallet',
//         spendingPassword: spendingPass,
//       };
//       const url = `${explorer}/api/v1/wallets`;
//       const resultWallet = await fetch(url, {
//         method: 'post',
//         body: JSON.stringify(body),
//         headers: { 'Content-Type': 'application/json' },
//       });
//       const datasWallet = await resultWallet.json();
//       console.log('====================================================');
//       console.log(datasWallet);
//       console.log('====================================================');
//     });

//     await Promise.all(task);
//   });
// });
