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

  async findByEmail(
    email: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        email,
      },

      relations: {
        location: true,
        till: true,
      },
    });
  }

  // ============================================================
  // FIND BY ID
  // ============================================================

  async findById(
    id: number,
  ): Promise<User> {
    const user =
      await this.userRepository.findOne({
        where: {
          id,
        },

        relations: {
          location: true,
          till: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
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
  // GET MAIN BRANCH
  // ============================================================

  async getMainBranchId(): Promise<string | null> {
    /*
     * First try exact "Main Branch".
     */

    const mainBranch =
      await this.locationRepository.findOne({
        where: {
          name: 'Main Branch',
          isActive: true,
        },
      });

    if (mainBranch) {
      return mainBranch.id;
    }

    /*
     * If exact name is not found,
     * use the first active branch.
     *
     * This is only a fallback.
     */
    const firstActiveBranch =
      await this.locationRepository.findOne({
        where: {
          isActive: true,
        },

        order: {
          createdAt: 'ASC',
        },
      });

    return firstActiveBranch?.id ?? null;
  }

  // ============================================================
  // CREATE USER - INTERNAL / AUTH COMPATIBILITY
  // ============================================================

  async create(
    userData: Partial<User>,
  ): Promise<User> {
    if (!userData.email) {
      throw new BadRequestException(
        'Email is required',
      );
    }

    const existingUser =
      await this.findByEmail(
        userData.email,
      );

    if (existingUser) {
      throw new ConflictException(
        'Email already exists',
      );
    }

    await this.validateAssignment(
      userData.role,
      userData.locationId,
      userData.tillId,
    );

    const user =
      this.userRepository.create(
        userData,
      );

    const savedUser =
      await this.userRepository.save(
        user,
      );

    return this.findById(
      savedUser.id,
    );
  }

  // ============================================================
  // CREATE MANAGED USER
  // OWNER ONLY
  // ============================================================

  async createManagedUser(
    dto: CreateUserDto,
  ): Promise<User> {
    // ----------------------------------------------------------
    // ROLE VALIDATION
    // ----------------------------------------------------------

    if (
      dto.role !== UserRole.OWNER &&
      dto.role !== UserRole.MANAGER &&
      dto.role !== UserRole.CASHIER
    ) {
      throw new BadRequestException(
        'Only OWNER, MANAGER and CASHIER users can be created',
      );
    }

    // ----------------------------------------------------------
    // EMAIL CHECK
    // ----------------------------------------------------------

    const existingUser =
      await this.findByEmail(
        dto.email,
      );

    if (existingUser) {
      throw new ConflictException(
        'Email already exists',
      );
    }

    // ----------------------------------------------------------
    // OWNER
    // ----------------------------------------------------------

    let locationId:
      string | null = null;

    let tillId:
      number | null = null;

    if (dto.role === UserRole.OWNER) {
      /*
       * Owner gets Main Branch automatically.
       *
       * No till for Owner.
       */
      locationId =
        await this.getMainBranchId();

      if (!locationId) {
        throw new BadRequestException(
          'Main Branch does not exist',
        );
      }

      tillId = null;
    }

    // ----------------------------------------------------------
    // MANAGER
    // ----------------------------------------------------------

    if (dto.role === UserRole.MANAGER) {
      locationId =
        dto.locationId ?? null;

      tillId = null;
    }

    // ----------------------------------------------------------
    // CASHIER
    // ----------------------------------------------------------

    if (dto.role === UserRole.CASHIER) {
      locationId =
        dto.locationId ?? null;

      tillId =
        dto.tillId ?? null;
    }

    // ----------------------------------------------------------
    // VALIDATE BRANCH / TILL
    // ----------------------------------------------------------

    await this.validateAssignment(
      dto.role,
      locationId,
      tillId,
    );

    // ----------------------------------------------------------
    // PASSWORD
    // ----------------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(
        dto.password,
        10,
      );

    // ----------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------

    const user =
      this.userRepository.create({
        firstName:
          dto.firstName,

        lastName:
          dto.lastName,

        email:
          dto.email,

        password:
          hashedPassword,

        role:
          dto.role,

        locationId,

        tillId,

        isActive:
          dto.isActive ?? true,
      });

    const savedUser =
      await this.userRepository.save(
        user,
      );

    return this.findById(
      savedUser.id,
    );
  }

  // ============================================================
  // UPDATE USER
  // ============================================================

  async updateUser(
    id: number,
    dto: UpdateUserDto,
  ): Promise<User> {
    const user =
      await this.findById(id);

    // ----------------------------------------------------------
    // EMAIL DUPLICATE CHECK
    // ----------------------------------------------------------

    if (
      dto.email &&
      dto.email.toLowerCase() !==
        user.email.toLowerCase()
    ) {
      const existingUser =
        await this.findByEmail(
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

    // ----------------------------------------------------------
    // NEXT VALUES
    // ----------------------------------------------------------

    const nextRole =
      dto.role ?? user.role;

    let nextLocationId:
      string | null =
        dto.locationId !== undefined
          ? dto.locationId
          : user.locationId;

    let nextTillId:
      number | null =
        dto.tillId !== undefined
          ? dto.tillId
          : user.tillId;

    // ----------------------------------------------------------
    // ROLE VALIDATION
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
    // OWNER
    // ----------------------------------------------------------

    if (
      nextRole === UserRole.OWNER
    ) {
      /*
       * Owner always belongs to Main Branch.
       * Owner does not have a till.
       */
      nextLocationId =
        await this.getMainBranchId();

      if (!nextLocationId) {
        throw new BadRequestException(
          'Main Branch does not exist',
        );
      }

      nextTillId = null;
    }

    // ----------------------------------------------------------
    // MANAGER
    // ----------------------------------------------------------

    if (
      nextRole === UserRole.MANAGER
    ) {
      nextTillId = null;
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

    if (
      dto.firstName !== undefined
    ) {
      user.firstName =
        dto.firstName;
    }

    if (
      dto.lastName !== undefined
    ) {
      user.lastName =
        dto.lastName;
    }

    if (
      dto.email !== undefined
    ) {
      user.email =
        dto.email;
    }

    user.role =
      nextRole;

    user.locationId =
      nextLocationId;

    user.tillId =
      nextTillId;

    // ----------------------------------------------------------
    // ACTIVE STATUS
    // ----------------------------------------------------------

    if (
      dto.isActive !== undefined
    ) {
      user.isActive =
        dto.isActive;
    }

    // ----------------------------------------------------------
    // PASSWORD
    // ----------------------------------------------------------

    if (dto.password) {
      user.password =
        await bcrypt.hash(
          dto.password,
          10,
        );
    }

    // ----------------------------------------------------------
    // SAVE
    // ----------------------------------------------------------

    const savedUser =
      await this.userRepository.save(
        user,
      );

    return this.findById(
      savedUser.id,
    );
  }

  // ============================================================
  // DEACTIVATE USER
  // ============================================================

  async deactivate(
    id: number,
  ): Promise<User> {
    const user =
      await this.findById(id);

    user.isActive = false;

    const savedUser =
      await this.userRepository.save(
        user,
      );

    return this.findById(
      savedUser.id,
    );
  }

  // ============================================================
  // ACTIVATE USER
  // ============================================================

  async activate(
    id: number,
  ): Promise<User> {
    const user =
      await this.findById(id);

    user.isActive = true;

    const savedUser =
      await this.userRepository.save(
        user,
      );

    return this.findById(
      savedUser.id,
    );
  }

  // ============================================================
  // CHECK OWNER
  // ============================================================

  async hasOwner(): Promise<boolean> {
    const owner =
      await this.userRepository.findOne({
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

    if (
      role === UserRole.OWNER
    ) {
      if (!locationId) {
        throw new BadRequestException(
          'Owner must be assigned to a branch',
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
          'Selected owner branch does not exist or is inactive',
        );
      }

      /*
       * Owner does not need a till.
       */

      return;
    }

    // ----------------------------------------------------------
    // MANAGER
    // ----------------------------------------------------------

    if (
      role === UserRole.MANAGER
    ) {
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

    if (
      role === UserRole.CASHIER
    ) {
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

      // --------------------------------------------------------
      // BRANCH
      // --------------------------------------------------------

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

      // --------------------------------------------------------
      // TILL
      // --------------------------------------------------------

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

      // --------------------------------------------------------
      // TILL → BRANCH CHECK
      // --------------------------------------------------------

      if (
        till.locationId !==
        locationId
      ) {
        throw new BadRequestException(
          'Selected till does not belong to selected branch',
        );
      }

      return;
    }

    // ----------------------------------------------------------
    // INVALID ROLE
    // ----------------------------------------------------------

    throw new BadRequestException(
      'Invalid user role',
    );
  }
}