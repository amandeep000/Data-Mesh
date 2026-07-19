import { Module } from '@nestjs/common';
import { AuthUseCase } from '../application/use-cases/auth.use-case';
import { AuthController } from './inbound/controllers/auth.controller';
import { PrismaUserRepository } from './outbound/persistence/prisma-user.repository';
import { BcryptPasswordAdapter } from './outbound//security/bcrypt-password.adapter';
import { JwtTokenAdapter } from './outbound/security/jwt-token.adapter';

@Module({
  controllers: [AuthController],
  providers: [
    AuthUseCase,
    { provide: 'IUserRepository', useClass: PrismaUserRepository },
    { provide: 'IPasswordPort', useClass: BcryptPasswordAdapter },
    { provide: 'ITokenPort', useClass: JwtTokenAdapter },
  ],
})
export class AuthModule {}