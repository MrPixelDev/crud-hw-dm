import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBalanceToUser1783606411071 implements MigrationInterface {
  name = 'AddBalanceToUser1783606411071';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "balance" numeric(12,2) NOT NULL DEFAULT '0.00'`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_contents_user_type_deleted_at"`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."contents_type_enum" RENAME TO "contents_type_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contents_type_enum" AS ENUM('avatar', 'file')`
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "type" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "type" TYPE "public"."contents_type_enum" USING "type"::"text"::"public"."contents_type_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "type" SET DEFAULT 'file'`
    );
    await queryRunner.query(`DROP TYPE "public"."contents_type_enum_old"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_contents_user_type_deleted_at" ON "contents" ("user_id", "type", "deleted_at") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_contents_user_type_deleted_at"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contents_type_enum_old" AS ENUM('avatar', 'file')`
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "type" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "type" TYPE "public"."contents_type_enum_old" USING "type"::"text"::"public"."contents_type_enum_old"`
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "type" SET DEFAULT 'file'`
    );
    await queryRunner.query(`DROP TYPE "public"."contents_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."contents_type_enum_old" RENAME TO "contents_type_enum"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contents_user_type_deleted_at" ON "contents" ("user_id", "type", "deleted_at") `
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "balance"`);
  }
}
