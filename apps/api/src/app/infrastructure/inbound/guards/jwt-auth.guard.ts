import { Injectable,CanActivate,ExecutionContext,UnauthorizedException } from "@nestjs/common";
import {Request} from "express";
import { ITokenPort } from "../../../domain/ports/outbound/token.port";

@Injectable()
export class JwtAuthGuard implements CanActivate{
    constructor (private readonly tokenPort:ITokenPort){}

    async canActivate(context:ExecutionContext): Promise<boolean>{
        const request = context.switchToHttp().getRequest<Request>()
        const authHeader = request.headers.authorization

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            throw new UnauthorizedException('Missing or invalid authorization header')
        }

        const token = authHeader.slice(7)

        try{
            const payload = await this.tokenPort.verifyAccessToken(token)
            return true

        }catch{
            throw new UnauthorizedException("Invalid or expired token")
        }
    }
}