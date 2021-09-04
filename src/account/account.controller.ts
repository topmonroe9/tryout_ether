import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { Account } from '../interfaces/account';
import { CreateAccountDto } from './dto/createAccount.dto';

@Controller('/account')
export class AccountController {
  constructor(private AddressService: AccountService) {}

  @Get()
  findAll() {
    return this.AddressService.findAll().then((accounts) => {
      return accounts;
    });
  }

  @Get(':id')
  findOne(@Param() params) {
    return this.AddressService.findOne(params.id).then((account) => {
      return account;
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
