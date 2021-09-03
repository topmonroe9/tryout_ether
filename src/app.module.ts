import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AddressController } from './address/address.controller';
import { AddressService } from './address/address.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AddressModule } from './address/address.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    AddressModule
  ],
  controllers: [AppController ],
  providers: [AppService],
})
export class AppModule {}
