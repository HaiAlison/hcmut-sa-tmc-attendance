import { MigrationInterface, QueryRunner } from "typeorm";

export class uniqueFactory1794559594768 implements MigrationInterface {
    name = 'uniqueFactory1794559594768'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "factories" ADD CONSTRAINT "UQ_c2945766d5fe1d4d258f0b2a24b" UNIQUE ("code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "factories" DROP CONSTRAINT "UQ_c2945766d5fe1d4d258f0b2a24b"`);
    }

}
