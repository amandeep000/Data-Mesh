import { User, UserWithPassword, CreateUserInput } from '../../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<UserWithPassword | null>;
  create(input: CreateUserInput): Promise<User>;
}