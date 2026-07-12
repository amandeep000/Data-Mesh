import { Injectable,Logger } from "@nestjs/common";
import { IAuthUseCase,  } from "../../domain/ports/inbound/auth.use-case";
import { IUserRepository } from "../../domain/ports/outbound/user-repository.port";
import { IPasswordPort } from "../../domain/ports/outbound/password.port";
import { ITokenPort } from "../../domain/ports/outbound/token.port";
import { User } from "../../domain/entities/user.entity";
import {ConflictError,UnauthorizedError} from '@data-mesh/shared-errors'
import type {RegisterDto,LoginDto,TokenResponse} from '@data-mesh/api-contracts'


@Injectable()
export class AuthUseCase implements IAuthUseCase {
    private readonly logger = new Logger(AuthUseCase.name);
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordPort: IPasswordPort,
        private readonly tokenPort: ITokenPort
    ){}

    async register(dto:RegisterDto):Promise<{user:User; tokens:TokenResponse}>{
        const existing = await this.userRepository.findByEmail(dto.email);
        if(existing){
            throw new ConflictError(`User with email ${dto.email} already exists`);
        }
        const passwordHash = await this.passwordPort.hash(dto.password);
        const user = await this.userRepository.create({
            email:dto.email,
            passwordHash,
            name:dto.name
        })

        const [accessToken, refreshToken] = await Promise.all([
            this.tokenPort.generateAccessToken(user.id, user.role),
            this.tokenPort.generateRefreshToken(user.id),
        ])

        this.logger.log(`User registered: ${user.id}`)

        return{
            user,
            tokens:{
                accessToken,
                refreshToken, 
                expiresIn: 3600
            }
        }
    }


    async login(dto:LoginDto):Promise<{user:User; tokens:TokenResponse}>{
        const userWithPass = await this.userRepository.findByEmail(dto.email);
        if(!userWithPass){
            throw new UnauthorizedError(`Invalid email or password`);
        }


        const isValid = await this.passwordPort.compare(dto.password, userWithPass.passwordHash)
        if(!isValid){
            throw new UnauthorizedError(`Invalid email or password`);
        }

        const {passwordHash:_, ...user} = userWithPass

        const [accessToken, refreshToken] = await Promise.all([
            this.tokenPort.generateAccessToken(user.id, user.role),
            this.tokenPort.generateRefreshToken(user.id)

        ])

        this.logger.log(`User logged in: ${user.id}`)

        return{
            user,
            tokens:{
                accessToken,
                refreshToken,
                expiresIn: 3600
            }
        }
    }


    async refresh_token(token:string):Promise<TokenResponse>{
        const payload = await this.tokenPort.verifyRefreshToken(token)

        const user = await this.userRepository.findById(payload.userId)
        if(!user){
            throw new UnauthorizedError(`Invalid refresh token`);
            
        }

        const [accessToken, refreshToken] = await Promise.all([
            this.tokenPort.generateAccessToken(user.id, user.role),
            this.tokenPort.generateRefreshToken(user.id)
        ])
        return {
            accessToken,
            refreshToken,
            expiresIn: 3600
        }
    }

}