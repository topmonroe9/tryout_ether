import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Account } from '../entities/account.entity';
import { Cron } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toAccountDto } from '../shared/mapper';
import { AccountDto } from './dto/account.dto';
const Web3 = require('web3');

@Injectable()
export class AccountService {
  constructor(
    private httpService: HttpService,
    @InjectRepository(Account) private accountRepository: Repository<Account>,
  ) {}

  @Cron('*/5 * * * * *') // Updating balances every 10 secs
  async updateBalances() {
    const data = await this.fetchBalances();

    if (data === null) {
      console.log('Status 0 returned from etherscan...');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const fetchedBalances: AccountDto[] = data.map((account) => {
      // @ts-ignore
      return { address: account.account, balance: account.balance };
    });

    fetchedBalances.forEach((account) => {
      account.balance = Web3.utils.fromWei(account.balance);
    });
    console.debug(fetchedBalances);
    await this.writeBalancesToDb(fetchedBalances);
  }

  private async writeBalancesToDb(data: AccountDto[]) {
    for (const fetchedAccount of data) {
      const accountFromDb = await this.accountRepository.findOne({
        address: fetchedAccount.address,
      });
      if ( accountFromDb.balance === null ) {
        console.debug('writing balance for new account', fetchedAccount.balance)
        accountFromDb.balance = fetchedAccount.balance
        await this.accountRepository.save(accountFromDb)
      }
      else if ( accountFromDb.balance !== fetchedAccount.balance ) {
        console.log('balance changed on account', accountFromDb.address)

        // write new balance

        // write a transaction

      }

    }
  }
  //
  // @Cron('*/5 * * * * *') // Updating balances every 10 secs
  // async updateBalances() {
  //   let data;
  //   this.callHttp().subscribe((res) => {
  //     data = res;
  //     data.result.forEach( item => {
  //       item.balance = Web3.utils.fromWei(item.balance);
  //       this.accounts[
  //         this.accounts.map((e) => e.address).indexOf(item.account) // get the correct account TODO change to db
  //       ].balance = item.balance;
  //     });
  //     console.log(this.accounts)
  //   } );
  // }

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
            console.log(axiosResponse.data.message)
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

  async findOne(address): Promise<Account> {
    return await this.accountRepository.findOne({ address: address });
  }

  async create(address: string) {
    const userInDb = await this.accountRepository.findOne({ address });
    if (userInDb)
      throw new HttpException(
        'This address already exists and being tracked.',
        HttpStatus.BAD_REQUEST,
      );

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
