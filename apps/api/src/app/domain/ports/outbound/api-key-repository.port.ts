import { ApiKey, CreateApiKeyInput } from '../../entities/api-key.entity';

export interface IApiKeyRepository {
  findByUserId(userId: string): Promise<ApiKey[]>;
  findByKeyHash(hash: string): Promise<ApiKey | null>;
  create(userId: string, input: CreateApiKeyInput): Promise<ApiKey>;
  revoke(keyId: string): Promise<void>;
  updateLastUsed(keyId: string): Promise<void>;
}