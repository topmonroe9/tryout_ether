import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Account } from '../entities/account.entity';
import { Cron } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThan, MoreThanOrEqual, Raw, Repository } from 'typeorm';
import { toAccountDto, toTransactionDto } from '../shared/mapper';
import { AccountDto } from './dto/account.dto';
import { Transaction } from '../entities/transaction.entity';
import { WSClientService } from './wsClient.service';
import { TransactionDto } from './dto/transaction.dto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

@Injectable()
export class AccountService {
  constructor(
    private httpService: HttpService,
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
    @Inject(WSClientService) private wsClientService: WSClientService,
  ) {}

  @Cron('*/5 * * * * *') // Updating balances every 10 secs
  async updateBalances() {
    const data = await this.fetchBalances();

    if (data === null) {
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

        // write a transaction
        const transaction = await this.transactionRepository.create({
          address: accountFromDb.address,
          transactionDate: new Date(Date.now()),
          transactionAmount: Math.abs(accountFromDb.balance - fetchedAccount.balance),
          openingBalance: accountFromDb.balance,
          closingBalance: fetchedAccount.balance,
        });
        await this.transactionRepository.save(transaction);

        // write new balance
        accountFromDb.balance = fetchedAccount.balance;
        await this.accountRepository.save(accountFromDb);
      }
    }
    // await Promise.allSettled(promises);
    //
    // async function processBalances(fetchedAccount) {
    //   const accountFromDb = await this.accountRepository.findOne({
    //     address: fetchedAccount.address,
    //   });
    //   if (accountFromDb.balance === null) {
    //     console.debug('writing balance for new account', fetchedAccount.balance);
    //     accountFromDb.balance = fetchedAccount.balance;
    //     await this.accountRepository.save(accountFromDb);
    //   } else if (accountFromDb.balance !== fetchedAccount.balance) {
    //     console.log('balance changed on account', accountFromDb.address);
    //
    //     // write new balance
    //     accountFromDb.balance = fetchedAccount.balance;
    //     await this.accountRepository.save(accountFromDb);
    //
    //     // write a transaction
    //     const transaction = await this.transactionRepository.create({
    //       address: accountFromDb.address,
    //       transactionDate: new Date(Date.now()),
    //       transactionAmount: Math.abs(accountFromDb.balance - fetchedAccount.balance),
    //       openingBalance: accountFromDb.balance,
    //       closingBalance: fetchedAccount.balance,
    //     });
    //     await this.transactionRepository.save(transaction);
    //   }
    // }
  }

  private async fetchBalances(): Promise<[] | null> {
    const accounts: AccountDto[] = await this.accountRepository.find();
    const listOfAddresses: string = accounts
      .map(function (item) {
        return item['address'];
      })
      .toString();
    return this.httpService
      .get(
        `https://api-ropsten.etherscan.io/api?module=account&action=balancemulti&address=${listOfAddresses}&tag=latest&apikey=${process.env.API_KEY_ETHERSCAN}`,
      )
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          if (axiosResponse.data.status != 1) {
            console.log(axiosResponse.data.message);
            return null;
          }
          return axiosResponse.data.result;
        }),
      )
      .toPromise();
  }

  async findAll(): Promise<Account[]> {
    return await this.accountRepository.find();
  }

  async findOne(address: string, query): Promise<AccountDto> {
    const account = await this.accountRepository.findOne({ address: address }).then((account) => {
      return toAccountDto(account);
    });

    if (query.currency) {
      query.currency = query.currency.split(',');
      console.debug(query);
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

        account.transactions = await this.getTransactions(query, address)
        account.median = this.getBalanceMedianInTimeFrame(account.transactions)
        // console.debug(account.transactions)
      }
    }
    return account;
  }

  private getBalanceMedianInTimeFrame( transactions: TransactionDto[] ): number {
    const arrOfNums = transactions.map( t => t.closingBalance )
    return median(arrOfNums)
  }

  private async getTransactions(query, address): Promise<TransactionDto[]> {
    const start = new Date(query.start);
    const end = new Date(query.end);

    if ( (isValidDate(start) && isValidDate(end)) || isValidDate(start) || isValidDate(end) )
    {
      if (query.start && query.end)
      {
        return await this.transactionRepository
          .find({
            where: {
              address,
              transactionDate: Between(start.toISOString(), end.toISOString())
            },
          })
          .then((transactions) => {
            return transactions.map((t) => toTransactionDto(t));
          });

      } else if (query.start)
      {
        return await this.transactionRepository
          .find({
            where: {
              address,
              transactionDate: MoreThanOrEqual(start.toISOString())
            },
          })
          .then((transactions) => {
            return transactions.map((t) => toTransactionDto(t));
          });
      } else if (query.end)
      {
        return await this.transactionRepository
          .find({
            where: {
              address,
              transactionDate: LessThanOrEqual(end.toISOString())
            },
          })
          .then((transactions) => {
            return transactions.map((t) => toTransactionDto(t));
          });
      }
    }

  }

  async create(address: string) {
    const userInDb = await this.accountRepository.findOne({ address });
    if (userInDb) throw new HttpException('This address already exists and being tracked.', HttpStatus.BAD_REQUEST);

    const account: Account = await this.accountRepository.create({ address });
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

function median(values){
  if(values.length ===0) return 0;

  values.sort(function(a,b){
    return a-b;
  });

  const half = Math.floor(values.length / 2);

  if (values.length % 2)
    return values[half];

  return (values[half - 1] + values[half]) / 2.0;
}
