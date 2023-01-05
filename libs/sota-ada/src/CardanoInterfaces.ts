export interface ICardanoExplorerAmount {
  readonly getCoin: string;
}

export interface ICardanoExplorerTransaction {
  readonly ctsId: string;
  readonly ctsTxTimeIssued: number;
  readonly ctsBlockTimeIssued: number;
  readonly ctsBlockHeight: number;
  readonly ctsBlockEpoch: number;
  readonly ctsBlockSlot: number;
  readonly ctsBlockHash: string;
  readonly ctsTotalInput: ICardanoExplorerAmount;
  readonly ctsTotalOutput: ICardanoExplorerAmount;
  readonly ctsFees: ICardanoExplorerAmount;
  readonly ctsInputs: Array<[string, ICardanoExplorerAmount]>;
  readonly ctsOutputs: Array<[string, ICardanoExplorerAmount]>;
}

export interface ICardanoWalletAddress {
  readonly changeAddress: boolean;
  readonly id: string;
  readonly ownership: string;
  readonly used: boolean;
}

export interface ICardanoExplorerTransactionV2 {
  readonly hash: string;
  readonly timestamp: number;
  readonly fees: number;
  readonly blockHeight: number;
  readonly slot: number;
  readonly epoch: number;
  readonly blockHash: string;
  readonly inputs: IInputCardanoTX[];
  readonly outputs: IOutputCardanoTX[];
}

export interface ICardanoAmount {
  unit: string;
  quantity: string;
}

export interface IInputCardanoTX {
  address: string;
  amount: ICardanoAmount[];
  tx_hash: string;
  output_index: number;
  data_hash: string | null;
  inline_datum: string | null;
  reference_script_hash: string | null;
  collateral: boolean;
  reference: boolean;
}

export interface IOutputCardanoTX {
  address: string;
  amount: ICardanoAmount[];
  output_index: number;
  data_hash: string | null;
  inline_datum: string | null;
  collateral: boolean;
  reference_script_hash: string | null;
}
