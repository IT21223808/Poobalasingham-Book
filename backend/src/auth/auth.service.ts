import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { UserRole } from '../users/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // =========================================================
  // REGISTER
  // =========================================================

  async register(registerDto: RegisterDto) {
    const existingUser =
      await this.usersService.findByEmail(
        registerDto.email,
      );

    if (existingUser) {
      throw new ConflictException(
        'Email already exists',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        registerDto.password,
        10,
      );

    /*
     * Public registration creates only a basic USER.
     *
     * OWNER / MANAGER / CASHIER users must be created
     * from the Users Management module.
     */
    const user = await this.usersService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
      role: UserRole.USER,
      locationId: null,
      tillId: null,
      isActive: true,
    });

    const {
      password,
      ...result
    } = user;

    return result;
  }

  // =========================================================
  // LOGIN
  // =========================================================

  async login(loginDto: LoginDto) {
    const user =
      await this.usersService.findByEmail(
        loginDto.email,
      );

    // -------------------------------------------------------
    // USER NOT FOUND
    // -------------------------------------------------------

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // -------------------------------------------------------
    // INACTIVE USER
    // -------------------------------------------------------

    if (!user.isActive) {
      throw new UnauthorizedException(
        'User account is inactive',
      );
    }

    // -------------------------------------------------------
    // PASSWORD CHECK
    // -------------------------------------------------------

    const isPasswordValid =
      await bcrypt.compare(
        loginDto.password,
        user.password,
      );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // =======================================================
    // JWT PAYLOAD
    // =======================================================

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,

      // Branch / Location
      locationId: user.locationId ?? null,

      // Till
      tillId: user.tillId ?? null,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    // =======================================================
    // LOGIN RESPONSE
    // =======================================================

    return {
      access_token: accessToken,

      user: {
        id: user.id,

        firstName: user.firstName,

        lastName: user.lastName,

        email: user.email,

        role: user.role,

        // ---------------------------------------------------
        // Branch
        // ---------------------------------------------------

        locationId:
          user.locationId ?? null,

        // ---------------------------------------------------
        // Till
        // ---------------------------------------------------

        tillId:
          user.tillId ?? null,

        // ---------------------------------------------------
        // Branch display information
        // ---------------------------------------------------

        location: user.location
          ? {
              id: user.location.id,
              name: user.location.name,
            }
          : null,

        // ---------------------------------------------------
        // Till display information
        // ---------------------------------------------------

        till: user.till
          ? {
              id: user.till.id,
              name: user.till.name,
              code: user.till.code,
            }
          : null,
      },
    };
  }

  async bootstrapOwner(registerDto: RegisterDto) {
  const ownerExists = await this.usersService.hasOwner();

  if (ownerExists) {
    throw new ConflictException(
      'Owner account already exists',
    );
  }

  const existingUser =
    await this.usersService.findByEmail(
      registerDto.email,
    );

  if (existingUser) {
    throw new ConflictException(
      'Email already exists',
    );
  }

  const hashedPassword =
    await bcrypt.hash(
      registerDto.password,
      10,
    );

  const user = await this.usersService.create({
    firstName: registerDto.firstName,
    lastName: registerDto.lastName,
    email: registerDto.email,
    password: hashedPassword,
    role: UserRole.OWNER,
    locationId: null,
    tillId: null,
    isActive: true,
  });

  return {
    message: 'Owner account created successfully',
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      locationId: user.locationId,
      tillId: user.tillId,
      isActive: user.isActive,
    },
  };
}
}