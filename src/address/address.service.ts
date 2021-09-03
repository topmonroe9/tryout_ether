import { Injectable } from '@nestjs/common';
import { Account } from '../interfaces/account';
import { Cron } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
const Web3 = require('web3');


@Injectable()
export class AddressService {
  constructor(private httpService: HttpService) {
  }
  private readonly addresses: Account[] = [
    {
      address: '0x61Eed69c0d112C690fD6f44bB621357B89fBE67F',
      balance: undefined,
    },
    {
      address: '0x1FF516E5ce789085CFF86d37fc27747dF852a80a',
      balance: undefined,
    },
  ]; // mocked

  @Cron('*/5 * * * * *') // Updating balances every 10 secs
  async updateBalances() {
    let data;
    this.callHttp().subscribe((res) => {
      data = res;
      data.result.forEach( item => {
        item.balance = Web3.utils.fromWei(item.balance);
      });
      console.log(data);
    } );

  }

  callHttp(): Observable<Array<Object>> {
    const listOfAddresses : string = (this.addresses.map(function(item) { return item["address"]; })).toString()
    return this.httpService
      .get(
        `https://api-ropsten.etherscan.io/api?module=account&action=balancemulti&address=${listOfAddresses}&tag=latest&apikey=${process.env.API_KEY_ETHERSCAN}`,
      )
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          return axiosResponse.data;
        })
      );
  }

  findAll(): Account[] {
    return this.addresses;
  }

  findOne(addressString): Account {
    return this.addresses[this.addresses.indexOf(addressString)];
  }

  // create(addressString: string) {
  //   this.addresses.push(addressString);
  //   return addressString
  // }
  //
  // update(addressString: Address) {
  //   this.addresses.push(addressString);
  // }
  //
  // remove(addressString: Address) {
  //   this.addresses.push(addressString);
  // }
}
