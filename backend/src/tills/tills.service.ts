import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Till } from './entities/till.entity';
import { Location } from '../inventory/entities/location.entity';
import { CreateTillDto } from './dto/create-till.dto';

@Injectable()
export class TillsService {
  constructor(
    @InjectRepository(Till)
    private readonly tillRepository: Repository<Till>,

    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(dto: CreateTillDto): Promise<Till> {
    const location = await this.locationRepository.findOne({
      where: {
        id: dto.locationId,
      },
    });

    if (!location) {
      throw new NotFoundException('Location/Branch not found');
    }

    const existingTill = await this.tillRepository.findOne({
      where: {
        code: dto.code,
      },
    });

    if (existingTill) {
      throw new ConflictException('Till code already exists');
    }

    const till = this.tillRepository.create({
      name: dto.name,
      code: dto.code,
      locationId: dto.locationId,
      isActive: dto.isActive ?? true,
    });

    return this.tillRepository.save(till);
  }

  async findAll(): Promise<Till[]> {
    return this.tillRepository.find({
      relations: {
  location: true,
},
      order: {
        id: 'ASC',
      },
    });
  }

  async findById(id: number): Promise<Till> {
    const till = await this.tillRepository.findOne({
      where: { id },
      relations: {
  location: true,
},
    });

    if (!till) {
      throw new NotFoundException('Till not found');
    }

    return till;
  }

  async findByLocation(locationId: string): Promise<Till[]> {
    return this.tillRepository.find({
      where: {
        locationId,
        isActive: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async update(
    id: number,
    dto: Partial<CreateTillDto>,
  ): Promise<Till> {
    const till = await this.findById(id);

    if (dto.code && dto.code !== till.code) {
      const existingTill = await this.tillRepository.findOne({
        where: {
          code: dto.code,
        },
      });

      if (existingTill && existingTill.id !== id) {
        throw new ConflictException('Till code already exists');
      }
    }

    if (dto.locationId) {
      const location = await this.locationRepository.findOne({
        where: {
          id: dto.locationId,
        },
      });

      if (!location) {
        throw new NotFoundException('Location/Branch not found');
      }
    }

    Object.assign(till, dto);

    return this.tillRepository.save(till);
  }

  async deactivate(id: number): Promise<Till> {
    const till = await this.findById(id);

    till.isActive = false;

    return this.tillRepository.save(till);
  }
}