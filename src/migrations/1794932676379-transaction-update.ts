import { MigrationInterface, QueryRunner } from "typeorm";

export class transactionUpdate1794932676379 implements MigrationInterface {
    name = 'transactionUpdate1794932676379'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance_transactions" DROP CONSTRAINT "FK_52b120bce209960f3c65d579e41"`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" DROP COLUMN "employeeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f3bcb48dfa250a411112aa3f4"`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" DROP COLUMN "employee_id"`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" ADD "employee_id" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_4f3bcb48dfa250a411112aa3f4" ON "attendance_transactions" ("employee_id") `);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" ADD CONSTRAINT "FK_4f3bcb48dfa250a411112aa3f49" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance_transactions" DROP CONSTRAINT "FK_4f3bcb48dfa250a411112aa3f49"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f3bcb48dfa250a411112aa3f4"`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" DROP COLUMN "employee_id"`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" ADD "employee_id" character varying(32)`);
        await queryRunner.query(`CREATE INDEX "IDX_4f3bcb48dfa250a411112aa3f4" ON "attendance_transactions" ("employee_id") `);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" ADD "employeeId" uuid`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" ADD CONSTRAINT "FK_52b120bce209960f3c65d579e41" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
