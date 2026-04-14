import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from './entities/session.entity';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from './guards/access-token.guard';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([SessionEntity]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TypeOrmModule, AccessTokenGuard],
  exports: [TypeOrmModule, AccessTokenGuard, AuthService],
})
export class AuthModule {}
