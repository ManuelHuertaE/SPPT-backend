// src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService, // Inject AuthService
  ) {}

  /**
   * Create a new user (OWNER or EMPLOYEE)
   * Only administrators (OWNER) can create users
   */
  async create(createUserDto: CreateUserDto, requestingUserId: string) {
    // Verify requesting user is an OWNER
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Requesting user not found');
    }

    if (requestingUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only OWNER users can create new users');
    }

    // Verify business exists and requesting user belongs to it
    const business = await this.prisma.business.findUnique({
      where: { id: createUserDto.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Verify requesting user belongs to the business
    if (requestingUser.businessId !== createUserDto.businessId) {
      throw new ForbiddenException('You can only create users for your own business');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password using AuthService
    const hashedPassword = await this.authService.hashPassword(createUserDto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        lastName: createUserDto.lastName,
        password: hashedPassword,
        role: createUserDto.role,
        businessId: createUserDto.businessId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        businessId: true,
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Find all users in a business
   */
  async findAll(businessId: string) {
    return this.prisma.user.findMany({
      where: { businessId },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a user by ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        businessId: true,
        business: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update a user (WITHOUT password)
   */
  async update(id: string, updateUserDto: UpdateUserDto, requestingUserId: string) {
    // Verify requesting user is an OWNER
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Requesting user not found');
    }

    if (requestingUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only OWNER users can update users');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify both users belong to the same business
    if (requestingUser.businessId !== user.businessId) {
      throw new ForbiddenException('You can only update users from your own business');
    }

    // If updating email, check it's not in use
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  /**
   * Deactivate a user (soft delete)
   */
  async deactivate(id: string, requestingUserId: string) {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Requesting user not found');
    }

    if (requestingUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only OWNER users can deactivate users');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requestingUser.businessId !== user.businessId) {
      throw new ForbiddenException('You can only deactivate users from your own business');
    }

    if (id === requestingUserId) {
      throw new ForbiddenException('You cannot deactivate yourself');
    }

    return this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        active: true,
      },
    });
  }

  /**
   * Activate a user
   */
  async activate(id: string, requestingUserId: string) {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser || requestingUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only OWNER users can activate users');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requestingUser.businessId !== user.businessId) {
      throw new ForbiddenException('You can only activate users from your own business');
    }

    return this.prisma.user.update({
      where: { id },
      data: { active: true },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        active: true,
      },
    });
  }
}