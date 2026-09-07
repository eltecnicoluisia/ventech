import { Module } from '@nestjs/common';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MulticurrencyModule } from '../multicurrency/multicurrency.module';

@Module({
  imports: [PrismaModule, MulticurrencyModule],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
