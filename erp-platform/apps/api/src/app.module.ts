import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { MulticurrencyModule } from './multicurrency/multicurrency.module';
import { PosModule } from './pos/pos.module';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    MulticurrencyModule,
    PosModule,
    ExchangeRateModule,
    InventoryModule,
    SalesModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

