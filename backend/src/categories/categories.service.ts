import {
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "./entities/category.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const existingCategory =
      await this.categoryRepository.findOne({
        where: {
          name: createCategoryDto.name,
        },
      });

    if (existingCategory) {
      throw new ConflictException(
        "Category already exists",
      );
    }

    const category = this.categoryRepository.create(
      createCategoryDto,
    );

    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
  return await this.categoryRepository.find({
    order: {
      createdAt: "DESC",
    },
  });
}
}