import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Exclude } from 'class-transformer';

import { UserRole } from '../user-role.enum';
import { Location } from '../../inventory/entities/location.entity';
import { Till } from '../../tills/entities/till.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  // =========================
  // BRANCH / LOCATION
  // =========================

  @Column({
    type: 'uuid',
    nullable: true,
  })
  locationId!: string | null;

  @ManyToOne(() => Location, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'locationId' })
  location!: Location | null;

  // =========================
  // TILL
  // =========================

  @Column({
    nullable: true,
  })
  tillId!: number | null;

  @ManyToOne(() => Till, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'tillId' })
  till!: Till | null;

  // =========================
  // STATUS
  // =========================

  @Column({ default: true })
  isActive!: boolean;

  // =========================
  // TIMESTAMPS
  // =========================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}