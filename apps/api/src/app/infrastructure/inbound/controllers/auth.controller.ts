import { Controller,Post,HttpCode,HttpStatus,Body} from "@nestjs/common"
import { ApiTags,ApiOperation,ApiResponse,ApiBody } from "@nestjs/swagger"
import { IAuthUseCase } from "../../../domain/ports/inbound/auth.use-case"
import { RegisterSchema,LoginSchema,RefreshSchema } from "@data-mesh/api-contracts"
import { RegisterDto,LoginDto,TokenResponse } from "@data-mesh/api-contracts"


@ApiTags("Auth")
@Controller({path:'auth',version:'1'})
export class AuthController{
    constructor(private readonly authUseCase:IAuthUseCase){}


@Post('register')
@ApiOperation({ summary: 'Register a new user' })
@ApiResponse({ status: 201, description: 'user registered successfully' })
@ApiResponse({ status: 409, description: 'Email already exists' })

async register(@Body() dto:RegisterDto):Promise<{user:unknown;tokens:TokenResponse}>{
    const result = await this.authUseCase.register(dto)
    return {
        user:{
            id:result.user.id,
            email:result.user.email,
            name:result.user.name,
            role:result.user.role,
            createdAt:result.user.createdAt.toISOString(),
            updatedAt:result.user.updatedAt.toISOString()
        
        },
        tokens:result.tokens
    }
}

@Post('login')
@HttpCode(HttpStatus.OK)
@ApiOperation({summary:"Login with email and pasword"})
@ApiResponse({status:200,description:"Login successful"})
@ApiResponse({status:401,description:"Invalid credentials"})
async login(@Body() dto:LoginDto):Promise<{user:unknown;tokens:TokenResponse}>{
    const result = await this.authUseCase.login(dto) 
    return {
        user:{
            id:result.user.id,
            email:result.user.email,
            name:result.user.name,
            role:result.user.role,
            createdAt:result.user.createdAt.toISOString(),
            updatedAt:result.user.updatedAt.toISOString()
        },
        tokens:result.tokens
    }
}


@Post('refresh')
@HttpCode(HttpStatus.OK)
@ApiOperation({summary:"Refresh access token"})
@ApiResponse({status:200,description:"Token refreshed "})
@ApiResponse({status:401,description:"Invalid refresh token"})
async refresh (@Body() dto: {refreshToken:string}) : Promise<TokenResponse>{
    return this.authUseCase.refresh_token(dto.refreshToken)
}
}

