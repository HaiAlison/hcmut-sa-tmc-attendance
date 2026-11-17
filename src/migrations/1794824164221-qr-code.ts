import { MigrationInterface, QueryRunner } from "typeorm";

export class qrCode1794824164221 implements MigrationInterface {
    name = 'qrCode1794824164221'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD "code" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP COLUMN "code"`);
    }

}
