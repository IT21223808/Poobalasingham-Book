import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Location } from '../../inventory/entities/location.entity';

@Entity('tills')
export class Till {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 50 })
  code!: string;

  @Column()
  locationId!: string;

  @ManyToOne(() => Location, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'locationId' })
  location!: Location;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}