import {
  Body,
  Controller,
  Post,Get,Query
} from "@nestjs/common";
import { SubcategoriesService } from "./subcategories.service";
import { CreateSubcategoryDto } from "./dto/create-subcategory.dto";

@Controller("subcategories")
export class SubcategoriesController {
  constructor(
    private readonly subcategoriesService: SubcategoriesService,
  ) {}

  @Post()
  async create(
    @Body() createSubcategoryDto: CreateSubcategoryDto,
  ) {
    return this.subcategoriesService.create(
      createSubcategoryDto,
    );
  }

  @Get()
async findAll(
  @Query("categoryId") categoryId?: string,
) {
  return this.subcategoriesService.findAll(categoryId);
}
}
