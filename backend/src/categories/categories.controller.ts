import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";

@Controller("categories")
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  @Post()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(
      createCategoryDto,
    );
  }

  @Delete(":id")
async remove(@Param("id") id: string) {
  return this.categoriesService.remove(id);
}

  @Get()
async findAll() {
  return this.categoriesService.findAll();
}
}