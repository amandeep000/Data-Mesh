import { Dataset, CreateDatasetInput, UpdateDatasetInput } from "../../entities/dataset.entity";
import {PaginatedResponse} from "@data-mesh/api-contracts";

export interface IDatasetUseCase{
    listDatasets(page:number,limit:number,filters?:{source?:string;tags?:string[]}):Promise<PaginatedResponse<Dataset>>;
    getDatasetBySlug(slug:string):Promise<Dataset>;
    createDataset(input:CreateDatasetInput):Promise<Dataset>;
    updateDataset(slug:string,input:UpdateDatasetInput):Promise<Dataset>;
    deleteDataset(slug:string):Promise<void>;
}