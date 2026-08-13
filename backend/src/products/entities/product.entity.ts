import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Category } from "../../categories/entities/category.entity";
import { Subcategory } from "../../subcategories/entities/subcategory.entity";

@Entity("products")
export class Product {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // Product Basic Information
    @Column({
        name: "product_code",
        unique: true,
    })
    productCode!: string;

    @Column({
        nullable: true,
        unique: true,
    })
    barcode!: string;

    @Column({
        nullable: true,
        unique: true,
    })
    isbn!: string;

    @Column({
        name: "product_name",
    })
    productName!: string;

    // Book Details
    @Column({
        nullable: true,
    })
    author!: string;

    @Column({
        nullable: true,
    })
    publisher!: string;

    @Column({
        nullable: true,
    })
    language!: string;

    @Column({
        nullable: true,
    })
    grade!: string;

    @Column({
        nullable: true,
    })
    subject!: string;

    @Column({
        nullable: true,
    })
    edition!: string;

    @Column({
        nullable: true,
    })
    brand!: string;

    // Timestamps
    @CreateDateColumn({
        name: "created_at",
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt!: Date;


    // Pricing Information
@Column("decimal", {
  name: "purchase_price",
  precision: 12,
  scale: 2,
  default: 0,
})
purchasePrice!: number;

@Column("decimal", {
  name: "selling_price",
  precision: 12,
  scale: 2,
  default: 0,
})
sellingPrice!: number;

@Column("decimal", {
  name: "wholesale_price",
  precision: 12,
  scale: 2,
  default: 0,
})
wholesalePrice!: number;

@Column({
  name: "stock_quantity",
  type: "integer",
  default: 0,
})
stockQuantity!: number;

@Column({
  name: "reorder_level",
  type: "integer",
  default: 0,
})
reorderLevel!: number;

// Product Image
@Column({
  name: "image_url",
  nullable: true,
})
imageUrl!: string;

@ManyToOne(() => Category, {
  nullable: true,
  onDelete: "SET NULL",
})
category!: Category;

@ManyToOne(() => Subcategory, {
  nullable: true,
  onDelete: "SET NULL",
})
subcategory!: Subcategory;
}