import { Transaction } from '../../entities/transaction.entity';
import { Column } from 'typeorm';

export class TransactionDto {
  id: number;
  blockNumber: string;
  blockHash: string;
  hash: string;
  from: string;
  to: string;
  value: number;
  confirmations: number;
  timeStamp: Date;
  isError: number;
}
