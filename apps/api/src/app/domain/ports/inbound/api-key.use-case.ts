import { ApiKey,ApiKeyWithSecret,CreateApiKeyInput } from "../../entities/api-key.entity";

export interface IApiKeyUseCase{
    createKey(userId:string,input:CreateApiKeyInput):Promise<ApiKeyWithSecret>;
    listKeys(userId:string):Promise<ApiKey[]>;
    revokeKey(userId:string,keyId:string):Promise<void>;
    validateKey(key:string):Promise<{userId:string;rateLimit:number} | null>
}
