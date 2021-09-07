import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Account } from '../entities/account.entity';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, getConnection, Repository } from 'typeorm';
import { toAccountDto, toTransactionDto } from '../shared/mapper';
import { AccountDto } from './dto/account.dto';
import { Transaction } from '../entities/transaction.entity';
import { WSClientService } from './wsClient.service';
import { TransactionDto } from './dto/transaction.dto';
import { EtherscanApiService } from './etherscan-api.service';
import { TransactionEtherHistoryDto } from './dto/transactionEtherHistory.dto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

@Injectable()
export class AccountService {
  constructor(
    private httpService: HttpService,
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
    @Inject(WSClientService) private wsClientService: WSClientService,
    @Inject(EtherscanApiService) private etherscanApiService: EtherscanApiService,
  ) {}

  @Cron('* * * * *') // Updating balances every 10 secs
  async updateBalances() {
    console.debug('staring updateBalances()');
    const accounts = await this.accountRepository.find();
    const data = await this.etherscanApiService.fetchBalances(accounts);
    const arrOfAddresses = accounts.map((a) => a.address.toLowerCase());
    console.log(arrOfAddresses);
    const history = await this.etherscanApiService.fetchHistoriesByAddressArray(arrOfAddresses);

    if (!data || !history) {
      console.log('Status 0 returned from etherscan...');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore // TODO Fix this crap
    const fetchedBalances: AccountDto[] = data.map((account) => {
      // @ts-ignore
      return { address: account.account, balance: account.balance };
    });

    fetchedBalances.forEach((account) => {
      account.balance = Web3.utils.fromWei(account.balance.toString());
    });

    await this.writeBalancesToDb(fetchedBalances);
    // await this.writeHistories(
    //  history
    //    .filter(({ status }) => status === 'fulfilled') // typings not working as expected fsr
    //    .map((p) => p.value)
    // );
    const listOfTxToSave: TransactionEtherHistoryDto[] = history
      .map((h) => {
        if (h.status === 'fulfilled') {
          return h.value;
        }
      })
      .flat(1);
    await this.writeHistories(listOfTxToSave);
  }

  private async writeHistories(historyArray: TransactionEtherHistoryDto[]) {
    console.debug('starting writeHistory');
    // first start will take quiet some time, get a cup of coffee
    console.log(historyArray.length);
    const allTransactionsInDB = await this.transactionRepository.find();
    const existingHashes = allTransactionsInDB.map((t) => t.hash);
    const promises = [];
    let i = 0;
    for (const transaction of historyArray) {
      i++;
      console.log('i', i);
      // console.log('transaction: ', i, transaction)
      if (existingHashes.includes(transaction.hash)) {
        // then record exists in db => skipping
        console.log('skipping', i);
        continue;
      }

      const newRecord = this.transactionRepository.create();
      Object.assign(newRecord, transaction);
      newRecord.value = Web3.utils.fromWei(transaction.value);
      newRecord.timeStamp = new Date(+transaction.timeStamp * 1000);
      promises.push(this.transactionRepository.save(newRecord).catch((e) => console.log(e)));
    }
    await Promise.allSettled(promises);
  }

  private async writeBalancesToDb(data: AccountDto[]) {
    const promises = [];
    for (const fetchedAccount of data) {
      // promises.push(processBalances(fetchedAccount));
      const accountFromDb = await this.accountRepository.findOne({
        address: fetchedAccount.address,
      });
      if (accountFromDb.balance === null) {
        console.debug('writing balance for new account', fetchedAccount.balance);
        accountFromDb.balance = fetchedAccount.balance;
        await this.accountRepository.save(accountFromDb);
      } else if (accountFromDb.balance !== fetchedAccount.balance) {
        console.log('balance changed on account', accountFromDb.address);

        //fire this function if balance changed
        this.updateTransactionsByAddress(accountFromDb.address).then(() =>
          console.log('transactions of address updated'),
        );

        // write new balance
        accountFromDb.balance = fetchedAccount.balance;
        await this.accountRepository.save(accountFromDb);
      }
    }
  }

  async updateTransactionsByAddress(address: string) {
    const history = await this.etherscanApiService.fetchHistoryByAddress(address.toLowerCase());
  }

  async findAll(): Promise<Account[]> {
    return await this.accountRepository.find();
  }

  async findOne(address: string, query): Promise<AccountDto> {
    const account = await this.accountRepository.findOne({ address: address.toLowerCase() }).then((account) => {
      if (account) return toAccountDto(account);
      else throw new HttpException('Account not found', 404);
    });

    if (query.currency) {
      query.currency = query.currency.split(',');
      if (query.currency.includes('eur')) {
        account.balanceEUR = this.wsClientService.ETHEUR;
      }
      if (query.currency.includes('usd')) {
        account.balanceUSD = this.wsClientService.ETHUSDT;
      }
    }

    if (query.with) {
      query.with = query.with.split(',');
      if (query.with.includes('history')) {
        account.transactions = await this.getTransactions(query, address);
        if (query.start && query.end) account.median = AccountService.getBalanceMedianInTimeFrame(account.transactions);
      }
    }
    return account;
  }

  private static getBalanceMedianInTimeFrame(transactions: TransactionDto[]): number {
    const arrOfNums = transactions.map((t) => t.value);
    return median(arrOfNums);
  }

  private async getTransactions(query, address): Promise<TransactionDto[]> {
    const start = new Date(query.start);
    const end = new Date(query.end);

    if ((isValidDate(start) && isValidDate(end)) || isValidDate(start) || isValidDate(end)) {
      if (query.start && query.end) {
        const query = getConnection()
          .createQueryBuilder()
          .select('*')
          .from(Transaction, 't')
          .where(`("from" = :address OR "to" = :address)`, { address })
          .andWhere('("timeStamp" >= :startDate AND "timeStamp" <= :endDate)',
            { startDate: start.toISOString(), endDate: end.toISOString() })

        console.log(query.getSql());
        return await query.getRawMany()
      } else if (query.start) {
        const query = getConnection()
          .createQueryBuilder()
          .select('*')
          .from(Transaction, 't')
          .where(`("from" = :address OR "to" = :address)`, { address })
          .andWhere('"timeStamp" >= :startDate', { startDate: start.toISOString() })

        console.log(query.getSql());
        return await query.getRawMany()
      } else if (query.end) {
        const query = getConnection()
          .createQueryBuilder()
          .select('*')
          .from(Transaction, 't')
          .where(`("from" = :address OR "to" = :address)`, { address })
          .andWhere('"timeStamp" <= :endDate', { endDate: end.toISOString() })
        console.log(query.getSql());
        return await query.getRawMany()

        // return await this.transactionRepository
        //   .find({
        //     where: {
        //       address,
        //       transactionDate: LessThanOrEqual(end.toISOString()),
        //     },
        //   })
        //   .then((transactions) => {
        //     return transactions.map((t) => toTransactionDto(t));
        //   });
      }
    } else {
      console.debug('sending without date frames');
      return await this.transactionRepository.find({
        where: [{ from: address }, { to: address }],
      });
    }
  }

  async create(address: string) {
    const userInDb = await this.accountRepository.findOne({ address });
    if (userInDb) throw new HttpException('This address already exists and being tracked.', HttpStatus.BAD_REQUEST);

    const account: Account = this.accountRepository.create({ address: address.toLowerCase() });
    await this.accountRepository.save(account);
    return toAccountDto(account);
  }

  //
  // update(addressString: Address) {
  //   this.addresses.push(addressString);
  // }
  //
  // remove(addressString: Address) {
  //   this.addresses.push(addressString);
  // }
}

// helpers

function isValidDate(d): boolean {
  if (Object.prototype.toString.call(d) === '[object Date]') {
    // it is a date
    if (isNaN(d.getTime())) {
      // d.valueOf() could also work
      // date is not valid
      return false;
    } else {
      // date is valid
      return true;
    }
  } else {
    // not a date
    return false;
  }
}

function median(values) {
  if (values.length === 0) return 0;

  values.sort(function (a, b) {
    return a - b;
  });

  const half = Math.floor(values.length / 2);

  if (values.length % 2) return values[half];

  return (values[half - 1] + values[half]) / 2.0;
}
