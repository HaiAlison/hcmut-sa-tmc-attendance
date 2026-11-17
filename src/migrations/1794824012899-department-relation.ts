import { MigrationInterface, QueryRunner } from "typeorm";

export class departmentRelation1794824012899 implements MigrationInterface {
    name = 'departmentRelation1794824012899'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "department_name"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "department_id"`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "department_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_678a3540f843823784b0fe4a4f2" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_678a3540f843823784b0fe4a4f2"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "department_id"`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "department_id" character varying(32) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "department_name" character varying(100) NOT NULL`);
    }

}
