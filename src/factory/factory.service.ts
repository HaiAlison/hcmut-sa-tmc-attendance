import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FactoryEntity } from 'src/entities/factory.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FactoryService implements OnModuleInit {
    private readonly logger = new Logger(FactoryService.name);

    constructor(@InjectRepository(FactoryEntity) private readonly factoryRepository: Repository<FactoryEntity>,
    ) {}

    async onModuleInit(): Promise<void> {
        await this.seedFactories();
    }
    private async seedFactories(): Promise<void> {
        const factories: Partial<FactoryEntity>[] = [
            {
                name: 'Binh Duong Factory',
                code: 'BDF',
                address: 'Binh Duong Province',
                status: 'ACTIVE'
            },
            {
                name: 'Dong Nai Factory',
                code: 'DNF',
                address: 'Dong Nai Province',
                status: 'ACTIVE'
            }
        ];
        await this.factoryRepository.upsert(factories, ['code']);
        this.logger.log(`Seeded default factories: ${factories.map(f => f.name).join(', ')}`);

    }

    async getFactories() {
        return await this.factoryRepository.find();
    }
}
