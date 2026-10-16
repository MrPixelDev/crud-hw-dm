import { Global, Module } from '@nestjs/common';
import { HelpersService, HttpExceptionFilter } from './helpers.service';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [HelpersService, HttpExceptionFilter],
  exports: [HelpersService, HttpExceptionFilter, JwtModule],
})
export class HelpersModule {}
