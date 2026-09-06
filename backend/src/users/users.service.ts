import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Location } from '../inventory/entities/location.entity';
import { Till } from '../tills/entities/till.entity';
import { UserRole } from './user-role.enum';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,

    @InjectRepository(Till)
    private readonly tillRepository: Repository<Till>,
  ) {}

  // ============================================================
  // FIND BY EMAIL
  // ============================================================

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: {
        location: true,
        till: true,
      },
    });
  }

  // ============================================================
  // FIND BY ID
  // ============================================================

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        location: true,
        till: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ============================================================
  // LIST USERS
  // ============================================================

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: {
        location: true,
        till: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  // ============================================================
  // CREATE USER - INTERNAL / AUTH COMPATIBILITY
  // ============================================================

  async create(userData: Partial<User>): Promise<User> {
    const existingUser = await this.findByEmail(userData.email!);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    await this.validateAssignment(
      userData.role,
      userData.locationId,
      userData.tillId,
    );

    const user = this.userRepository.create(userData);

    return this.userRepository.save(user);
  }

  // ============================================================
  // CREATE MANAGED USER
  // OWNER ONLY
  // ============================================================

  async createManagedUser(dto: CreateUserDto): Promise<User> {
    if (
      dto.role !== UserRole.OWNER &&
      dto.role !== UserRole.MANAGER &&
      dto.role !== UserRole.CASHIER
    ) {
      throw new BadRequestException(
        'Only OWNER, MANAGER and CASHIER users can be created',
      );
    }

    const existingUser = await this.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    await this.validateAssignment(
      dto.role,
      dto.locationId,
      dto.tillId,
    );

    const hashedPassword = await bcrypt.hash(
      dto.password,
      10,
    );

    const user = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
      locationId: dto.role === UserRole.OWNER
        ? null
        : dto.locationId ?? null,
      tillId: dto.role === UserRole.CASHIER
        ? dto.tillId ?? null
        : null,
      isActive: dto.isActive ?? true,
    });

    const savedUser = await this.userRepository.save(user);

    return this.findById(savedUser.id);
  }

  // ============================================================
  // UPDATE USER
  // ============================================================

  async updateUser(
    id: number,
    dto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findById(id);

    // ----------------------------------------------------------
    // EMAIL DUPLICATE CHECK
    // ----------------------------------------------------------

    if (
      dto.email &&
      dto.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      const existingUser = await this.findByEmail(
        dto.email,
      );

      if (
        existingUser &&
        existingUser.id !== id
      ) {
        throw new ConflictException(
          'Email already exists',
        );
      }
    }

    const nextRole =
      dto.role ?? user.role;

    const nextLocationId =
      dto.locationId !== undefined
        ? dto.locationId
        : user.locationId;

    const nextTillId =
      dto.tillId !== undefined
        ? dto.tillId
        : user.tillId;

    // ----------------------------------------------------------
    // VALIDATE ROLE
    // ----------------------------------------------------------

    if (
      nextRole !== UserRole.OWNER &&
      nextRole !== UserRole.MANAGER &&
      nextRole !== UserRole.CASHIER
    ) {
      throw new BadRequestException(
        'Only OWNER, MANAGER and CASHIER users are allowed',
      );
    }

    // ----------------------------------------------------------
    // VALIDATE BRANCH / TILL
    // ----------------------------------------------------------

    await this.validateAssignment(
      nextRole,
      nextLocationId,
      nextTillId,
    );

    // ----------------------------------------------------------
    // BASIC FIELDS
    // ----------------------------------------------------------

    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }

    if (dto.email !== undefined) {
      user.email = dto.email;
    }

    user.role = nextRole;

    // OWNER does not need branch/till
    if (nextRole === UserRole.OWNER) {
      user.locationId = null;
      user.tillId = null;
    }

    // MANAGER needs branch but no till
    if (nextRole === UserRole.MANAGER) {
      user.locationId = nextLocationId!;
      user.tillId = null;
    }

    // CASHIER needs branch + till
    if (nextRole === UserRole.CASHIER) {
      user.locationId = nextLocationId!;
      user.tillId = nextTillId!;
    }

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    // ----------------------------------------------------------
    // PASSWORD
    // ----------------------------------------------------------

    if (dto.password) {
      user.password = await bcrypt.hash(
        dto.password,
        10,
      );
    }

    const savedUser =
      await this.userRepository.save(user);

    return this.findById(savedUser.id);
  }

  // ============================================================
  // DEACTIVATE USER
  // ============================================================

  async deactivate(id: number): Promise<User> {
    const user = await this.findById(id);

    user.isActive = false;

    const savedUser =
      await this.userRepository.save(user);

    return this.findById(savedUser.id);
  }

  // ============================================================
  // ACTIVATE USER
  // ============================================================

  async activate(id: number): Promise<User> {
    const user = await this.findById(id);

    user.isActive = true;

    const savedUser =
      await this.userRepository.save(user);

    return this.findById(savedUser.id);
  }

  async hasOwner(): Promise<boolean> {
  const owner = await this.userRepository.findOne({
    where: {
      role: UserRole.OWNER,
    },
  });

  return !!owner;
}
  // ============================================================
  // VALIDATE BRANCH / TILL ASSIGNMENT
  // ============================================================

  private async validateAssignment(
    role?: UserRole,
    locationId?: string | null,
    tillId?: number | null,
  ): Promise<void> {
    // ----------------------------------------------------------
    // OWNER
    // ----------------------------------------------------------

    if (role === UserRole.OWNER) {
      return;
    }

    // ----------------------------------------------------------
    // MANAGER
    // ----------------------------------------------------------

    if (role === UserRole.MANAGER) {
      if (!locationId) {
        throw new BadRequestException(
          'Manager must be assigned to a branch',
        );
      }

      const location =
        await this.locationRepository.findOne({
          where: {
            id: locationId,
            isActive: true,
          },
        });

      if (!location) {
        throw new BadRequestException(
          'Selected branch does not exist or is inactive',
        );
      }

      return;
    }

    // ----------------------------------------------------------
    // CASHIER
    // ----------------------------------------------------------

    if (role === UserRole.CASHIER) {
      if (!locationId) {
        throw new BadRequestException(
          'Cashier must be assigned to a branch',
        );
      }

      if (!tillId) {
        throw new BadRequestException(
          'Cashier must be assigned to a till',
        );
      }

      const location =
        await this.locationRepository.findOne({
          where: {
            id: locationId,
            isActive: true,
          },
        });

      if (!location) {
        throw new BadRequestException(
          'Selected branch does not exist or is inactive',
        );
      }

      const till =
        await this.tillRepository.findOne({
          where: {
            id: tillId,
            isActive: true,
          },
        });

      if (!till) {
        throw new BadRequestException(
          'Selected till does not exist or is inactive',
        );
      }

      if (till.locationId !== locationId) {
        throw new BadRequestException(
          'Selected till does not belong to selected branch',
        );
      }

      return;
    }

    throw new BadRequestException(
      'Invalid user role',
    );
  }
}