import {
  ConflictException,
  Injectable,NotFoundException,
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

  async remove(id: string): Promise<void> {
  const category = await this.categoryRepository.findOne({
    where: {
      id,
    },
  });

  if (!category) {
    throw new NotFoundException("Category not found");
  }

  await this.categoryRepository.remove(category);
}

  async findAll(): Promise<Category[]> {
  return await this.categoryRepository.find({
    order: {
      createdAt: "DESC",
    },
  });
}
}