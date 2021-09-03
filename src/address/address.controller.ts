import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AddressService } from './address.service';
import { Account } from '../interfaces/account';

@Controller('address')
export class AddressController {
  constructor(private AddressService: AddressService) {}

  @Get()
  findAll(): Account[] {
    return this.AddressService.findAll();
  }

  @Get(':id')
  findOne(@Param() params): Account {
    return this.AddressService.findOne(params.id);
  }
  // TODO Need dto
  // @Post(':id')
  // createOne(@Body() body): Address {
  //   return this.AddressService.create(params.id);
  // }

  @Patch(':id')
  updateOne(): string {
    return 'This action adds a cat';
  }

  @Delete(':id')
  deleteOne(): string {
    return 'This action removes a cat';
  }
}
