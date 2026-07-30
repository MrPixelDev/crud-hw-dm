import 'dotenv/config';
// import { SessionEntity } from '@crud-hw-dm/auth/entities/session.entity';
// import { UserEntity } from '@crud-hw-dm/users/entities/user.entity';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT ?? 5434),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity{.ts,.js}', 'dist/**/*.entities{.ts,.js}'],
  // entities: [UserEntity, SessionEntity],
  migrations: ['@crud-hw-dm/databases/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
