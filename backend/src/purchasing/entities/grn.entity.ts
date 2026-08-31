import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { GrnItem } from './grn-item.entity';

export enum GrnStatus {
  DRAFT = 'DRAFT',
  RECEIVED = 'RECEIVED',
  PARTIAL = 'PARTIAL',
  CANCELLED = 'CANCELLED',
}

@Entity('goods_received_notes')
export class GoodsReceivedNote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  grnNumber!: string;

  @Column()
  purchaseOrderId!: number;

  @Column({ type: 'uuid' })
locationId!: string;

  @Column({
    type: 'enum',
    enum: GrnStatus,
    default: GrnStatus.DRAFT,
  })
  status!: GrnStatus;

  @OneToMany(
    () => GrnItem,
    (item) => item.grn,
    {
      cascade: true,
    },
  )
  items!: GrnItem[];

  @CreateDateColumn()
  createdAt!: Date;
}