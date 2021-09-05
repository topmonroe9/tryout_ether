import { Transaction } from '../../entities/transaction.entity';
import { Column } from 'typeorm';

export class TransactionDto {
  id: number;
  address: string;
  transactionDate: Date;
  transactionAmount: number;
  openingBalance: number;
  closingBalance: number;
}