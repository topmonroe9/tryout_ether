import { Account } from '../entities/account.entity';
import { AccountDto } from '../account/dto/account.dto';
import { Transaction } from '../entities/transaction.entity';
import { TransactionDto } from '../account/dto/transaction.dto';

export const toAccountDto = (data: Account): AccountDto => {
  const { id, address, balance } = data;
  return { id, address, balance };
};

export const toTransactionDto = (data: Transaction): TransactionDto => {
  const { id, blockNumber, blockHash, hash, from, value, confirmations, timestamp, isError } = data;
  return {
    id,
    blockNumber,
    blockHash,
    hash,
    from,
    value,
    confirmations,
    timestamp,
    isError
  };
};
