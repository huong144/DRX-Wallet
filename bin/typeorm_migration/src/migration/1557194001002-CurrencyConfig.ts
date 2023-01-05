import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { getTableName } from '../service/getTable';

export class CurrencyConfig1557194001002 implements MigrationInterface {
  private tableName = 'currency_config';
  private fullTableName = getTableName(this.tableName);

  public async up(queryRunner: QueryRunner): Promise<any> {
    const tableName = this.fullTableName;
    await queryRunner.createTable(
      new Table({
        name: tableName,
        columns: [
          {
            name: 'currency',
            type: 'varchar',
            length: '190',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'network',
            type: 'varchar',
          },
          {
            name: 'chain_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'chain_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'average_block_time',
            type: 'int',
          },
          {
            name: 'required_confirmations',
            type: 'int',
          },
          {
            name: 'internal_endpoint',
            type: 'varchar',
          },
          {
            name: 'rpc_endpoint',
            type: 'varchar',
          },
          {
            name: 'rest_endpoint',
            type: 'varchar',
          },
          {
            name: 'explorer_endpoint',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'hd_path',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'bigint',
            isNullable: true,
          },
        ],
      }),
      true
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`currency`, `network`, `chain_id`, `chain_name`, `average_block_time`, `required_confirmations`, `internal_endpoint`, `rpc_endpoint`, `rest_endpoint`, `explorer_endpoint`, `created_at`, `updated_at`, `hd_path`)' +
        ' VALUES ' +
        `('btc', 'testnet', '', 'Testnet', 30000, 1, 'http://0.0.0.0:47001', '{\"protocol\":\"https\",\"host\":\"bitcorenodetest:local321@bitcoin-testnet-rpc-228.sotatek.works\"}', 'https://bitcore-node-testnet-228.sotatek.works/api/BTC/testnet', '', 1557636432024, 1557636432024, "m/44'/0'/0'/0/")`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`currency`, `network`, `chain_id`, `chain_name`, `average_block_time`, `required_confirmations`, `internal_endpoint`, `rpc_endpoint`, `rest_endpoint`, `explorer_endpoint`, `created_at`, `updated_at`, `hd_path`)' +
        ' VALUES ' +
        `('bch', 'testnet', '', 'Testnet', 30000, 1, 'http://0.0.0.0:47012', '{"protocol":"https","host":"bch.sotatek.works","user":"root","pass":"sota1234"}', 'http://ltc-api.sotatek.works/api/BCH/testnet', '', 1557636432024, 1557636432024, "m/44'/145'/0'/0/")`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`currency`, `network`, `chain_id`, `chain_name`, `average_block_time`, `required_confirmations`, `internal_endpoint`, `rpc_endpoint`, `rest_endpoint`, `explorer_endpoint`, `created_at`, `updated_at` ,`hd_path`)' +
        ' VALUES ' +
        `('ltc', 'testnet', '', 'Testnet', 30000, 1, 'http://0.0.0.0:47014', '{"protocol":"https","host":"ltc.sotatek.works","user":"root","pass":"sota1234"}', 'http://ltc-api.sotatek.works/api/LTC/testnet', '', 1557636432024, 1557636432024, "m/44'/2'/0'/0/")`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`currency`, `network`, `chain_id`, `chain_name`, `average_block_time`, `required_confirmations`, `internal_endpoint`, `rpc_endpoint`, `rest_endpoint`, `explorer_endpoint`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('eos', 'testnet', 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f', 'Jungle3', 500, 0, 'http://0.0.0.0:47013', '', 'https://jungle3.greymass.com', '', 1557636432024, 1557636432024)`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`currency`, `network`, `chain_id`, `chain_name`, `average_block_time`, `required_confirmations`, `internal_endpoint`, `rpc_endpoint`, `rest_endpoint`, `explorer_endpoint`, `created_at`, `updated_at`, `hd_path`)' +
        ' VALUES ' +
        `('eth', 'testnet', '5', 'Goerli', '6000', '6', 'http://0.0.0.0:47002', '', 'https://goerli.infura.io/v3/cbc0dce4b2174caabf7ed0c4865920ff', 'https://goerli.etherscan.io', '1557636432024', '1557636432024', "m/44'/60'/0'/0/")`
    );

    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`currency`, `network`, `chain_id`, `chain_name`, `average_block_time`, `required_confirmations`, `internal_endpoint`, `rpc_endpoint`, `rest_endpoint`, `explorer_endpoint`, `created_at`, `updated_at`, `hd_path`)' +
        ' VALUES ' +
        `('bnb', 'testnet', '97', 'BSCTestnet', '3000', '1', 'http://0.0.0.0:47015', '', 'https://data-seed-prebsc-1-s1.binance.org:8545', 'https://testnet.bscscan.com', '1557636432024', '1557636432024', "m/44'/60'/0'/0/")`
    );

    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`currency`, `network`, `chain_name`, `average_block_time`, `required_confirmations`, `internal_endpoint`, `rpc_endpoint`, `rest_endpoint`, `explorer_endpoint`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('xrp', 'testnet', 'Testnet', '3500', '10', 'http://0.0.0.0:47004', 'https://s.devnet.rippletest.net:51234', '', 'https://test.bithomp.com/explorer/', '1557636432024', '1557636432024')`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`currency`, `network`, `chain_name`, `average_block_time`, `required_confirmations`, `internal_endpoint`, `rpc_endpoint`, `rest_endpoint`, `explorer_endpoint`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('ada', 'testnet', 'Testnet', '6000', '9', 'http://0.0.0.0:47011', '', 'http://54.234.89.150:8090', 'https://cardano-explorer.cardano-testnet.iohkdev.io', '1557636432024', '1557636432024')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const tableName = this.fullTableName;
    await queryRunner.dropTable(tableName);
  }
}
