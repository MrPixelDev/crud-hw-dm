import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PassedConstraints1785424152641 implements MigrationInterface {
  name = 'PassedConstraints1785424152641';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "balance" = '0.00' WHERE "balance" < 0`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "Check_positive_balance" CHECK ("balance"
      >= 0)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "Check_positive_balance"`
    );
  }
}
