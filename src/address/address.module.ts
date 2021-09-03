import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';

@Module({
  imports: [HttpModule],
  providers: [AddressController, AddressService],
})
export class AddressModule {}
