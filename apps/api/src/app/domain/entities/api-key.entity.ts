export interface ApiKey {
  id: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  userId: string;
  rateLimit: number;
  isActive: boolean;
  lastUsed: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyInput {
  name: string;
  rateLimit: number;
  expiresAt?: Date;
}

export interface ApiKeyWithSecret extends ApiKey {
  rawKey: string;
}