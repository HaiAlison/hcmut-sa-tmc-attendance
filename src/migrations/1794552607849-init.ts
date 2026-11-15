import { MigrationInterface, QueryRunner } from "typeorm";

export class init1794552607849 implements MigrationInterface {
    name = 'init1794552607849'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "departments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(100) NOT NULL, "factoryId" character varying NOT NULL, "factory_id" uuid, CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "factories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(150) NOT NULL, "code" character varying(32) NOT NULL, "address" character varying(255) NOT NULL, "status" character varying(32) NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "PK_177dc0be43525ae77a73639eb70" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "gates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(100) NOT NULL, "factory_id" uuid NOT NULL, "type" character varying(32) NOT NULL DEFAULT 'BIDIRECTIONAL', "status" character varying(32) NOT NULL DEFAULT 'ONLINE', "location" character varying(150) NOT NULL, "ip_address" character varying(64), "mac_address" character varying(64), "firmware_version" character varying(32), "last_heartbeat_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_2dd58a77462dd2c5695ec4a7975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attendance_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "employee_id" character varying(32), "factory_id" uuid NOT NULL, "gate_id" uuid NOT NULL, "event_type" character varying(32) NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "qr_payload" character varying(255), "qr_validation" character varying(32) NOT NULL DEFAULT 'VALID', "status" character varying(32) NOT NULL, "denial_reason" character varying(64), "error_message" character varying(255), "synced" boolean NOT NULL DEFAULT true, "sync_status" character varying(32) NOT NULL DEFAULT 'SYNCED', "offline" boolean NOT NULL DEFAULT false, "employeeId" uuid, CONSTRAINT "PK_a92cba2385b63607a140ff3445a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4f3bcb48dfa250a411112aa3f4" ON "attendance_transactions" ("employee_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_96ac715ed70145738e5540d5c0" ON "attendance_transactions" ("gate_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ad4ba863326f1fd59f44fc2ee6" ON "attendance_transactions" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_e738eec270cd83241397e61624" ON "attendance_transactions" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_41a9406dc014199435d15df1a4" ON "attendance_transactions" ("sync_status") `);
        await queryRunner.query(`CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "full_name" character varying(150) NOT NULL, "department_id" character varying(32) NOT NULL, "department_name" character varying(100) NOT NULL, "position" character varying(100) NOT NULL, "factory_id" uuid NOT NULL, "email" character varying(150) NOT NULL, "phone" character varying(32) NOT NULL, "employment_status" character varying(32) NOT NULL DEFAULT 'ACTIVE', "hire_date" date NOT NULL, "date_of_birth" date NOT NULL, "gender" character varying(8) NOT NULL, CONSTRAINT "UQ_765bc1ac8967533a04c74a9f6af" UNIQUE ("email"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "qr_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "employeeId" uuid NOT NULL, "factoryId" character varying NOT NULL, "status" character varying(32) NOT NULL DEFAULT 'ACTIVE', "payload" character varying(255) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "lastUsedAt" TIMESTAMP WITH TIME ZONE, "factory_id" uuid, CONSTRAINT "PK_4b7aa338e150a878ce9e2c55c5c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_44df2ec4a95bf31646ba8b461b" ON "qr_codes" ("employeeId") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(150) NOT NULL, "email" character varying(150) NOT NULL, "password" character varying(255) NOT NULL, "role" character varying(50) NOT NULL DEFAULT 'EMPLOYEE', "status" character varying(50) NOT NULL DEFAULT 'ACTIVE', "linked_employee_id" uuid, "refreshTokenHash" character varying(255), "lastLogin" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "FK_f48c77eef1cc461a2d9a7a5eb13" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gates" ADD CONSTRAINT "FK_fc2276a82c3f5beb63437547922" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" ADD CONSTRAINT "FK_52b120bce209960f3c65d579e41" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" ADD CONSTRAINT "FK_09ac5a6d415c36f2f97069b9f55" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" ADD CONSTRAINT "FK_96ac715ed70145738e5540d5c0b" FOREIGN KEY ("gate_id") REFERENCES "gates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_9220e61ca603c8e89599e95d23b" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD CONSTRAINT "FK_44df2ec4a95bf31646ba8b461b0" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD CONSTRAINT "FK_4ba136f1b1a5078b01889392d60" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c603eb6a91ad08790388305f7aa" FOREIGN KEY ("linked_employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c603eb6a91ad08790388305f7aa"`);
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP CONSTRAINT "FK_4ba136f1b1a5078b01889392d60"`);
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP CONSTRAINT "FK_44df2ec4a95bf31646ba8b461b0"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_9220e61ca603c8e89599e95d23b"`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" DROP CONSTRAINT "FK_96ac715ed70145738e5540d5c0b"`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" DROP CONSTRAINT "FK_09ac5a6d415c36f2f97069b9f55"`);
        await queryRunner.query(`ALTER TABLE "attendance_transactions" DROP CONSTRAINT "FK_52b120bce209960f3c65d579e41"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP CONSTRAINT "FK_fc2276a82c3f5beb63437547922"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT "FK_f48c77eef1cc461a2d9a7a5eb13"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_44df2ec4a95bf31646ba8b461b"`);
        await queryRunner.query(`DROP TABLE "qr_codes"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_41a9406dc014199435d15df1a4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e738eec270cd83241397e61624"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ad4ba863326f1fd59f44fc2ee6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_96ac715ed70145738e5540d5c0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f3bcb48dfa250a411112aa3f4"`);
        await queryRunner.query(`DROP TABLE "attendance_transactions"`);
        await queryRunner.query(`DROP TABLE "gates"`);
        await queryRunner.query(`DROP TABLE "factories"`);
        await queryRunner.query(`DROP TABLE "departments"`);
    }

}
