import { MigrationInterface, QueryRunner } from "typeorm";

export class qrCode1794994876610 implements MigrationInterface {
    name = 'qrCode1794994876610'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP CONSTRAINT "FK_44df2ec4a95bf31646ba8b461b0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_44df2ec4a95bf31646ba8b461b"`);
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP COLUMN "employeeId"`);
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP COLUMN "factoryId"`);
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD "employee_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP CONSTRAINT "FK_4ba136f1b1a5078b01889392d60"`);
        await queryRunner.query(`ALTER TABLE "qr_codes" ALTER COLUMN "factory_id" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_7a7cd5515253cf0e1be42d2bd4" ON "qr_codes" ("employee_id") `);
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD CONSTRAINT "FK_7a7cd5515253cf0e1be42d2bd40" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD CONSTRAINT "FK_4ba136f1b1a5078b01889392d60" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP CONSTRAINT "FK_4ba136f1b1a5078b01889392d60"`);
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP CONSTRAINT "FK_7a7cd5515253cf0e1be42d2bd40"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7a7cd5515253cf0e1be42d2bd4"`);
        await queryRunner.query(`ALTER TABLE "qr_codes" ALTER COLUMN "factory_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD CONSTRAINT "FK_4ba136f1b1a5078b01889392d60" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP COLUMN "employee_id"`);
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD "factoryId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD "employeeId" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_44df2ec4a95bf31646ba8b461b" ON "qr_codes" ("employeeId") `);
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD CONSTRAINT "FK_44df2ec4a95bf31646ba8b461b0" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
