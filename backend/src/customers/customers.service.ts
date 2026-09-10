import {
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
  // CREATE CUSTOMER / SELECT EXISTING CUSTOMER
  // =========================================================
  async create(dto: CreateCustomerDto): Promise<Customer> {
    /*
     * If phone number already exists:
     * --------------------------------
     * Do NOT create a duplicate customer.
     * Return the existing customer instead.
     *
     * This is especially useful for POS Quick Customer.
     */

    const phone = dto.phone?.trim();

    if (phone) {
      const existingCustomer =
        await this.customerRepository.findOne({
          where: {
            phone,
          },
        });

      if (existingCustomer) {
        return existingCustomer;
      }
    }

    // Generate new customer code only
    // when a new customer is actually created.
    const customerCode = await this.generateCustomerCode();

    const customer = this.customerRepository.create({
      customerCode,
      customerName: dto.customerName.trim(),
      phone: phone || undefined,
      email: dto.email?.trim() || undefined,
      address: dto.address?.trim() || undefined,
      city: dto.city?.trim() || undefined,
      isActive: dto.isActive ?? true,
    });

    return this.customerRepository.save(customer);
  }

  // =========================================================
  // GET ALL CUSTOMERS
  // =========================================================
  async findAll(
    search?: string,
    status?: string,
  ): Promise<Customer[]> {
    const query =
      this.customerRepository.createQueryBuilder('customer');

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
      .orderBy('customer.createdAt', 'DESC')
      .getMany();
  }

  // =========================================================
  // GET CUSTOMER BY ID
  // =========================================================
  async findOne(id: number): Promise<Customer> {
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
  // UPDATE CUSTOMER
  // =========================================================
  async update(
    id: number,
    dto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    Object.assign(customer, {
      ...dto,
      customerName:
        dto.customerName?.trim() ??
        customer.customerName,

      phone:
        dto.phone?.trim() ??
        customer.phone,

      email:
        dto.email?.trim() ??
        customer.email,

      address:
        dto.address?.trim() ??
        customer.address,

      city:
        dto.city?.trim() ??
        customer.city,
    });

    return this.customerRepository.save(customer);
  }

  // =========================================================
  // DEACTIVATE CUSTOMER
  // =========================================================
  async remove(id: number): Promise<Customer> {
    const customer = await this.findOne(id);

    customer.isActive = false;

    return this.customerRepository.save(customer);
  }

  // =========================================================
  // ACTIVATE CUSTOMER
  // =========================================================
  async activate(id: number): Promise<Customer> {
    const customer = await this.findOne(id);

    customer.isActive = true;

    return this.customerRepository.save(customer);
  }

  // =========================================================
  // GENERATE CUSTOMER CODE
  // =========================================================
  private async generateCustomerCode(): Promise<string> {
    const lastCustomer =
      await this.customerRepository
        .createQueryBuilder('customer')
        .orderBy('customer.id', 'DESC')
        .getOne();

    const nextNumber =
      lastCustomer
        ? lastCustomer.id + 1
        : 1;

    return `CUS-${String(nextNumber).padStart(3, '0')}`;
  }
}