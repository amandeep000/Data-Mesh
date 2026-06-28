import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { IUserRepository } from "../../../domain/ports/outbound/user-repository.port";
import { User, UserWithPassword,CreateUserInput } from "../../../domain/entities/user.entity";

@Injectable()
export class PrismaUserRepository implements IUserRepository{
    constructor(private readonly prisma:PrismaService){}

    async findById(id:string):Promise<User | null>{
        const record = await this.prisma.user.findUnique({where:{id}});
        if(!record) return null
        return this.toDomain(record)
    }

    async findByEmail(email:string):Promise<UserWithPassword | null>{
        const record = await this.prisma.user.findUnique({where:{email}})
        if(!record) return null
        return this.toDomainWithPassword(record)
    }

    async create(input:CreateUserInput):Promise<User>{
        const record = await this.prisma.user.create({data:{
            email:input.email,
            passwordHash:input.passwordHash,
            name:input.name
        }})
        return this.toDomain(record)
}

private toDomain(record:{id:string,email:string,passwordHash:string,name:string | null; role:string,createdAt:Date,updatedAt:Date}):User{
    return{
        id:record.id,
        email:record.email,
        name:record.name,
        role:record.role as User['role'],
        createdAt:record.createdAt,
        updatedAt:record.updatedAt
    }
}

private toDomainWithPassword(record:{id:string,email:string,passwordHash:string,name:string | null; role:string,createdAt:Date,updatedAt:Date}):UserWithPassword{
    return{
        ...this.toDomain(record),
        passwordHash:record.passwordHash
    }
}
}
