import { Transaction } from '../../entities/transaction.entity';
import { TransactionDto } from './transaction.dto';

export class AccountDto {
  id: number;
  address: string;
  balance: number;
  balanceUSD?: number;
  balanceEUR?: number;
  transactions?: TransactionDto[];
  median?: number;
}
