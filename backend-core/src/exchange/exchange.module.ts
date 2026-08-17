import { Module } from '@nestjs/common';
import { ExchangeController } from './exchange.controller';

@Module({
  controllers: [ExchangeController],
})
export class ExchangeModule {}
