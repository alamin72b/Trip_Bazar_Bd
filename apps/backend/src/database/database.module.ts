import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

function createDatabaseOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const databasePath = configService.get<string>(
    'database.path',
    'tripbazarbd.sqlite',
  );
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  const isInMemoryDatabase = databasePath === ':memory:';

  return {
    type: 'sqljs',
    autoLoadEntities: true,
    synchronize: nodeEnv !== 'production',
    logging: false,
    ...(isInMemoryDatabase
      ? {}
      : {
          location: databasePath,
          autoSave: true,
        }),
  };
}

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createDatabaseOptions(configService),
    }),
  ],
})
export class DatabaseModule {}
