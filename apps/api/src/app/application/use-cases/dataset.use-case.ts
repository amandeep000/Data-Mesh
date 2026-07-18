import { Injectable, Logger } from "@nestjs/common";
import { IDatasetUseCase } from "../../domain/ports/inbound/dataset.use-case";
import { IDatasetRepository } from "../../domain/ports/outbound/dataset-repository.port";
import { Dataset, CreateDatasetInput, UpdateDatasetInput } from "../../domain/entities/dataset.entity";
import { PaginatedResponse } from "@data-mesh/api-contracts";
import { NotFoundError, ConflictError } from "@data-mesh/shared-errors";

@Injectable()
export class DatasetUseCase implements IDatasetUseCase {
    private readonly logger = new Logger(DatasetUseCase.name)

    constructor(private readonly datasetRepository:IDatasetRepository){}

async listDatasets(page:number, limit:number, filters?:{source?:string;tags?:string[]}): Promise<PaginatedResponse<Dataset>> {


    const {data,total} = await this.datasetRepository.findAll(page,limit,filters)
    return {
        data,
        meta:{
            page,
            limit, 
            total,
            totalPages:Math.ceil(total/limit)
        }
    }
}

async getDatasetBySlug(slug:string): Promise<Dataset>{
    const dataset = await this.datasetRepository.findBySlug(slug)
    if(!dataset){
        throw new NotFoundError(`Dataset`,slug)
    }
    return dataset
}

async createDataset(input:CreateDatasetInput): Promise<Dataset> {
    const existing = await this.datasetRepository.findBySlug(input.slug ?? input.name)

if (existing) {
      throw new ConflictError(`Dataset with slug "${existing.slug}" already exists.`);
    }
const dataset = await this.datasetRepository.create(input)
this.logger.log(`Dataset created with slug: ${dataset.slug}`)
return dataset
}

async updateDataset(slug:string, input:UpdateDatasetInput): Promise<Dataset>{
    const existing = await this.datasetRepository.findBySlug(slug)
    if(!existing){
        throw new NotFoundError(`Dataset`,slug)
    }
    const updated = await this.datasetRepository.update(slug,input)
    this.logger.log(`Dataset updated with slug: ${updated.slug}`)
    return updated
}

async deleteDataset(slug:string):Promise<void>{
    const existing = await this.datasetRepository.findBySlug(slug)
    if(!existing){
        throw new NotFoundError(`Dataset`,slug)
    }
    await this.datasetRepository.delete(slug)
    this.logger.log(`Dataset deleted with slug: ${slug}`)
}

}