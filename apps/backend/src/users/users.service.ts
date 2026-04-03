import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { normalizeEmail } from '../common/utils/normalize-email.util';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';

interface CreateUserInput {
  email: string;
  passwordHash: string;
  role?: UserRole;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        email: normalizeEmail(email),
      },
    });
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const user = this.usersRepository.create({
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      role: input.role ?? UserRole.USER,
      isActive: input.isActive ?? true,
    });

    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        id,
      },
    });
  }

  async countUsersByRole(role: UserRole): Promise<number> {
    return this.usersRepository.count({
      where: {
        role,
      },
    });
  }

  async getAdminUsers(): Promise<AdminUserResponseDto[]> {
    const users = await this.usersRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) => this.toAdminResponseDto(user));
  }

  async getAdminUserById(id: string): Promise<AdminUserResponseDto> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.toAdminResponseDto(user);
  }

  async updateAdminUser(
    id: string,
    currentUser: AuthenticatedUser,
    updateAdminUserDto: UpdateAdminUserDto,
  ): Promise<AdminUserResponseDto> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const nextRole = updateAdminUserDto.role ?? user.role;
    const nextIsActive = updateAdminUserDto.isActive ?? user.isActive;

    if (currentUser.sub === user.id && (nextRole !== UserRole.ADMIN || !nextIsActive)) {
      throw new BadRequestException(
        'Admins cannot remove their own dashboard access.',
      );
    }

    if (
      user.role === UserRole.ADMIN &&
      user.isActive &&
      (nextRole !== UserRole.ADMIN || !nextIsActive)
    ) {
      const activeAdminCount = await this.usersRepository.count({
        where: {
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        throw new BadRequestException('At least one active admin must remain.');
      }
    }

    Object.assign(user, updateAdminUserDto);

    const updatedUser = await this.usersRepository.save(user);

    return this.toAdminResponseDto(updatedUser);
  }

  private toAdminResponseDto(user: User): AdminUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
