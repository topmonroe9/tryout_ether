import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';
import { AccountDto } from './dto/account.dto';
import { map } from 'rxjs/operators';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class EtherscanApiService {
  static baseUrl = 'https://api-ropsten.etherscan.io';
  static apiKey = `43WXIAANICII8WEXXDWAZM7ZM39IRHQXG3`;

  constructor(private httpService: HttpService) {}

  async fetchHistoryByAddress(address: string) {
    return this.httpService
      .get(
        `${EtherscanApiService.baseUrl}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&apikey=${EtherscanApiService.apiKey}`,
      )
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          if (axiosResponse.data.status != 1) {
            console.log(axiosResponse.data);
            return null;
          }
          return axiosResponse.data.result;
        }),
      )
      .toPromise();
  }

  async fetchHistoriesByAddressArray(addresses: string[]) {
    const promises = []
    for ( const address of addresses) {
      promises.push(
        this.fetchHistoryByAddress(address)
      )
    }
    const results = await Promise.allSettled(promises)
    console.log(results)
    return true
  }

  async fetchBalances(accounts: AccountDto[]): Promise<[] | null> {
    const listOfAddresses: string = accounts
      .map(function (item) {
        return item['address'];
      })
      .toString();
    return this.httpService
      .get(
        `${EtherscanApiService.baseUrl}/api?module=account&action=balancemulti&address=${listOfAddresses}&tag=latest&apikey=${EtherscanApiService.apiKey}`,
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
}
