import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../entities/account.entity';

@Module({
  imports: [HttpModule,
    TypeOrmModule.forFeature([Account])],
  providers: [AccountService],
  controllers: [AccountController]
})
export class AccountModule {}
