import { MigrationInterface, QueryRunner } from "typeorm";

export class gateUpdate1794914549745 implements MigrationInterface {
    name = 'gateUpdate1794914549745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gates" ADD "code" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gates" ADD CONSTRAINT "UQ_38e418fb0caca9a5a1f660ab893" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "firmware_version"`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "firmware_version" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "firmware_version"`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "firmware_version" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "gates" DROP CONSTRAINT "UQ_38e418fb0caca9a5a1f660ab893"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "code"`);
    }

}
