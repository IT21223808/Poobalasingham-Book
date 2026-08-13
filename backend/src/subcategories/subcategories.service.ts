import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subcategory } from "./entities/subcategory.entity";
import { Category } from "../categories/entities/category.entity";
import { CreateSubcategoryDto } from "./dto/create-subcategory.dto";

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(
    createSubcategoryDto: CreateSubcategoryDto,
  ): Promise<Subcategory> {
    const category = await this.categoryRepository.findOne({
      where: {
        id: createSubcategoryDto.categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    const existingSubcategory =
      await this.subcategoryRepository.findOne({
        where: {
          name: createSubcategoryDto.name,
          category: {
            id: category.id,
          },
        },
        relations: {
          category: true,
        },
      });

    if (existingSubcategory) {
      throw new ConflictException(
        "Subcategory already exists in this category",
      );
    }

    const subcategory =
      this.subcategoryRepository.create({
        name: createSubcategoryDto.name,
        description: createSubcategoryDto.description,
        isActive: createSubcategoryDto.isActive ?? true,
        category,
      });

    return await this.subcategoryRepository.save(
      subcategory,
    );
  }

  async findAll(categoryId?: string): Promise<Subcategory[]> {
  const where = categoryId
    ? {
        category: {
          id: categoryId,
        },
      }
    : {};

  return await this.subcategoryRepository.find({
    where,
    relations: {
      category: true,
    },
    order: {
      createdAt: "DESC",
    },
  });
}
}