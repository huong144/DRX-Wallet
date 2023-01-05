interface IAccountProps {
  walletId: string;
  spendingPassword: string;
  backupPhrase: string;
  accountId: number;
  address: string;
}

export class CardanoAcount {
  public readonly walletId: string;
  public readonly accountId: number;
  public readonly spendingPassword: string;
  public readonly backupPhrase: string;
  public readonly address: string;

  constructor(props: IAccountProps) {
    Object.assign(this, props);
  }
}

export default CardanoAcount;
