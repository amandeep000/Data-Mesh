import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { IDatasetUseCase } from "../../../domain/ports/inbound/dataset.use-case";
import { CreateDatasetInput, UpdateDatasetInput } from "../../../domain/entities/dataset.entity";
import { JwtAuthGuard } from "../guards/jwt-auth.guard"
import { RolesGuard } from "../guards/roles.guard"
import { Roles } from "../../common/decorators/roles.decorator"

@ApiTags('datasets')
@Controller({ path: 'datasets', version: '1' })
export class DatasetController {
    constructor(private readonly datasetUseCase: IDatasetUseCase) { }


    @Get()
    @ApiOperation({ summary: 'Get all datasets' })
    @ApiQuery({ name: 'source', required: false, enum: ['EEA', 'EUROSTAT', 'COPERNICUS'] })
    @ApiQuery({ name: 'tags', required: false, type: [String] })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async List(
        @Query('source') source?: string,
        @Query('tags') tags?: string[],
        @Query('page') page = '1',
        @Query('limit') limit = '20'
    ) {
        return this.datasetUseCase.listDatasets(
            parseInt(page, 10),
            parseInt(limit, 10),
            { source, tags },
        )
    }

@Get(':slug')
@ApiOperation({ summary: 'Get a dataset by slug' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Dataset not found' })
async getBySlug(@Param('slug') slug:string){
    const dataset = await this.datasetUseCase.getDatasetBySlug(slug);
    return dataset
}

@Post()
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new dataset (Admin only)' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async create(@Body() input:CreateDatasetInput){
    return this.datasetUseCase.createDataset(input)
  }

 @Patch(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a dataset (Admin only)' })
  async update(@Param('slug') slug: string, @Body() input: UpdateDatasetInput) {
    return this.datasetUseCase.updateDataset(slug, input);
  }

 @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a dataset (Admin only)' })
  @ApiResponse({ status: 204 })
  async delete(@Param('slug') slug: string): Promise<void> {
    await this.datasetUseCase.deleteDataset(slug);
  }









}