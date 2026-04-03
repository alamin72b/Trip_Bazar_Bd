import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordService } from '../auth/password.service';
import { normalizeEmail } from '../common/utils/normalize-email.util';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const seedEmail = this.configService.get<string>('admin.seedEmail', '');
    const seedPassword = this.configService.get<string>(
      'admin.seedPassword',
      '',
    );

    if (!seedEmail || !seedPassword) {
      return;
    }

    const normalizedEmail = normalizeEmail(seedEmail);
    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      this.logger.log(
        `Admin seed skipped because ${normalizedEmail} already exists.`,
      );
      return;
    }

    const passwordHash = await this.passwordService.hashPassword(seedPassword);

    await this.usersService.createUser({
      email: normalizedEmail,
      passwordHash,
      role: UserRole.ADMIN,
    });

    this.logger.log(`Seeded initial admin account for ${normalizedEmail}.`);
  }
}
