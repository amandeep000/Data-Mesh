import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

/**
 * AppModule — Root module of the NestJS API.
 *
 * Feature modules will be imported here as they are built out
 * following the TDD Red-Green-Refactor cycle.
 *
 * Hexagonal layers imported per feature:
 *   - Domain:         entities, ports (interfaces), domain services
 *   - Application:    use-cases, DTOs
 *   - Infrastructure: controllers (inbound), prisma/redis adapters (outbound)
 */
@Module({
  imports: [
    // ─── Rate Limiting (Upstash Redis via ThrottlerModule) ────────
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: parseInt(process.env['RATE_LIMIT_TTL'] ?? '60', 10),
        limit: parseInt(process.env['RATE_LIMIT_MAX'] ?? '100', 10),
      },
    ]),
    // TODO: PrismaModule will be added in Step 2
    // TODO: Feature modules (DatasetModule, AuthModule, ApiKeyModule) added per TDD step
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
