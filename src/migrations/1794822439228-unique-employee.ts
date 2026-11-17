import { MigrationInterface, QueryRunner } from "typeorm";

export class uniqueEmployee1794822439228 implements MigrationInterface {
    name = 'uniqueEmployee1794822439228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ADD "code" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "UQ_2f88c4dff473076e55ca2568d51" UNIQUE ("code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "UQ_2f88c4dff473076e55ca2568d51"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "code"`);
    }

}
