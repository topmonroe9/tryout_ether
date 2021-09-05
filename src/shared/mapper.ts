import { Account } from '../entities/account.entity';
import { AccountDto } from '../account/dto/account.dto';
import { Transaction } from '../entities/transaction.entity';
import { TransactionDto } from '../account/dto/transaction.dto';

export const toAccountDto = (data: Account): AccountDto => {
  const { id, address, balance } = data;
  const accountDto: AccountDto = { id, address, balance };
  return accountDto;
};

export const toTransactionDto = (data: Transaction): TransactionDto => {
  const { id, address, transactionDate, transactionAmount, openingBalance, closingBalance } = data;
  const transactionDto: TransactionDto = {
    id,
    address,
    transactionDate,
    transactionAmount,
    openingBalance,
    closingBalance,
  };
  return transactionDto;
};
