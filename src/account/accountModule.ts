import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';
import { WSClientService } from './wsClient.service';

@Module({
  imports: [HttpModule,
    TypeOrmModule.forFeature([Account, Transaction])],
  providers: [AccountService, WSClientService],
  controllers: [AccountController]
})
export class AccountModule {}
