import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post, Query,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { Account } from '../interfaces/account';
import { CreateAccountDto } from './dto/createAccount.dto';

@Controller('/account')
export class AccountController {
  constructor(private AddressService: AccountService) {}

  @Get()
  findOne(@Query() query) {
    if (query.address) {
      return this.AddressService.findOne(query.address, query).then((account) => {
        return account;
      });
    }

    return this.AddressService.findAll().then((accounts) => {
      return accounts;
    });

  }
  // TODO Need dto
  @Post(':address')
  create(@Param() param: CreateAccountDto) {
    console.log(param)
    return this.AddressService.create(param.address).then((account) => {
      return account;
    });
  }

  @Patch(':id')
  updateOne(): string {
    return 'This action adds a cat';
  }

  @Delete(':id')
  deleteOne(): string {
    return 'This action removes a cat';
  }
}
