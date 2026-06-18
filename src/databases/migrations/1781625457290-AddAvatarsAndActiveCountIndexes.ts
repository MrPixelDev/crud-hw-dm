import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarsAndActiveCountIndexes1781625457290 implements MigrationInterface {
  name = 'AddAvatarsAndActiveCountIndexes1781625457290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contents" DROP CONSTRAINT "FK_contents_user_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "active_avatar_count" integer NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "avatar" character varying(512)`
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
    await queryRunner.query(
      `CREATE INDEX "IDX_users_descr_age_avatar_count" ON "users" ("user_id", "age", "active_avatar_count") WHERE "description" IS NOT NULL AND btrim("description") <> ''`
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ADD CONSTRAINT "FK_528d636d7e228f5e0e729f079fb" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contents" DROP CONSTRAINT "FK_528d636d7e228f5e0e729f079fb"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_users_descr_age_avatar_count"`
    );
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
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "active_avatar_count"`
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ADD CONSTRAINT "FK_contents_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
