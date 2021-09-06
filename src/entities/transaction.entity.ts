import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  blockNumber: string;

  @Column()
  blockHash: string;

  @Column()
  hash: string;

  @Index()
  @Column()
  from: string;

  @Index()
  @Column({ nullable: true, type: 'numeric', precision: 20, scale: 18 })
  value: number;

  @Index()
  @Column()
  confirmations: number;

  @Column()
  timestamp: Date;

  @Column()
  isError: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

}
