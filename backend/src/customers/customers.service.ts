import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  // =========================================================
  // CREATE
  // =========================================================

  async create(dto: CreateCustomerDto): Promise<Customer> {
  try {
    const existingPhone = await this.customerRepository.findOne({
      where: {
        phone: dto.phone,
      },
    });

    if (existingPhone) {
      throw new ConflictException(
        'Customer with this phone number already exists',
      );
    }

    const customerCode = await this.generateCustomerCode();

    const customer = this.customerRepository.create({
      customerCode,
      customerName: dto.customerName,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      city: dto.city,
      isActive: dto.isActive ?? true,
    });
    const savedCustomer =
      await this.customerRepository.save(customer);
    return savedCustomer;
  } catch (error) {
    throw error;
  }
}

  // =========================================================
  // LIST
  // =========================================================

  async findAll(
    search?: string,
    status?: string,
  ): Promise<Customer[]> {
    const query =
      this.customerRepository
        .createQueryBuilder('customer');

    if (search) {
      query.andWhere(
        `(
          LOWER(customer.customerName) LIKE LOWER(:search)
          OR LOWER(customer.customerCode) LIKE LOWER(:search)
          OR customer.phone LIKE :search
          OR LOWER(customer.email) LIKE LOWER(:search)
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (status === 'ACTIVE') {
      query.andWhere(
        'customer.isActive = :isActive',
        {
          isActive: true,
        },
      );
    }

    if (status === 'INACTIVE') {
      query.andWhere(
        'customer.isActive = :isActive',
        {
          isActive: false,
        },
      );
    }

    return query
      .orderBy(
        'customer.createdAt',
        'DESC',
      )
      .getMany();
  }

  // =========================================================
  // VIEW
  // =========================================================

  async findOne(
    id: number,
  ): Promise<Customer> {
    const customer =
      await this.customerRepository.findOne({
        where: { id },
      });

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${id} not found`,
      );
    }

    return customer;
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(
    id: number,
    dto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer =
      await this.findOne(id);

    Object.assign(
      customer,
      dto,
    );

    return this.customerRepository.save(
      customer,
    );
  }

  // =========================================================
  // DEACTIVATE
  // =========================================================

  async remove(
    id: number,
  ): Promise<Customer> {
    const customer =
      await this.findOne(id);

    customer.isActive = false;

    return this.customerRepository.save(
      customer,
    );
  }

  // =========================================================
  // ACTIVATE
  // =========================================================

  async activate(
    id: number,
  ): Promise<Customer> {
    const customer =
      await this.findOne(id);

    customer.isActive = true;

    return this.customerRepository.save(
      customer,
    );
  }

  // =========================================================
  // GENERATE CUSTOMER CODE
  // =========================================================

  private async generateCustomerCode(): Promise<string> {
  const lastCustomer = await this.customerRepository
    .createQueryBuilder('customer')
    .orderBy('customer.id', 'DESC')
    .getOne();

  const nextNumber = lastCustomer
    ? lastCustomer.id + 1
    : 1;

  return `CUS-${String(nextNumber).padStart(3, '0')}`;
}
}