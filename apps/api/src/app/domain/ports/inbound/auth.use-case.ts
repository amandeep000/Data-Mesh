import {User} from "../../entities/user.entity";
import type {RegisterDto, LoginDto,TokenResponse} from '@data-mesh/api-contracts'

export interface IAuthUseCase{
    register(dto:RegisterDto):Promise<{user:User;tokens:TokenResponse}>;
    login(dto:LoginDto):Promise<{user:User; tokens:TokenResponse}>;
    refresh_token(token:string):Promise<TokenResponse>;
}