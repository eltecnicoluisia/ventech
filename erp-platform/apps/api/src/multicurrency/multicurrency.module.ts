import { Module, Global } from '@nestjs/common';
import { MulticurrencyService } from './multicurrency.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [MulticurrencyService],
  exports: [MulticurrencyService],
})
export class MulticurrencyModule {}
