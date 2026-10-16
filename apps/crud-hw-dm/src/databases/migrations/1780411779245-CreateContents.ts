import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContents1780411779245 implements MigrationInterface {
  name = 'CreateContents1780411779245';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."contents_type_enum" AS ENUM('avatar', 'file')`
    );
    await queryRunner.query(`
      CREATE TABLE "contents" (
        "content_id" SERIAL NOT NULL,
        "user_id" uuid NOT NULL,
        "type" "public"."contents_type_enum" NOT NULL DEFAULT 'file',
        "file_name" character varying(512) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_contents_content_id" PRIMARY KEY ("content_id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "contents" ADD CONSTRAINT "FK_contents_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contents_user_type_deleted_at" ON "contents" ("user_id", "type", "deleted_at")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_contents_user_type_deleted_at"`
    );
    await queryRunner.query(
      `ALTER TABLE "contents" DROP CONSTRAINT "FK_contents_user_id"`
    );
    await queryRunner.query(`DROP TABLE "contents"`);
    await queryRunner.query(`DROP TYPE "public"."contents_type_enum"`);
  }
}
