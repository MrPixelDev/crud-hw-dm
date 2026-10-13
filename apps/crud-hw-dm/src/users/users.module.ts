import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';
import { ProfileController } from './users.controller';
import { AuthModule } from '@crud-hw-dm/auth/auth.module';
import { KafkaModule } from '@kafka/kafka';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    forwardRef(() => AuthModule),
    KafkaModule,
  ],
  controllers: [ProfileController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
