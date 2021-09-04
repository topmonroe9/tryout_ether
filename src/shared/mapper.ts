import { Account } from '../entities/account.entity';
import { AccountDto } from '../account/dto/account.dto';

export const toAccountDto = (data: Account): AccountDto => {
  const { id, address, balance } = data;
  const accountDto: AccountDto = { id, address, balance };
  return accountDto;
};