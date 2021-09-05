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

  @Index()
  @Column({})
  address: string;

  @Column()
  transactionDate: Date;

  @Column({ nullable: true, type: 'numeric', precision: 20, scale: 18 })
  transactionAmount: number;

  @Column({ nullable: true, type: 'numeric', precision: 20, scale: 18 })
  openingBalance: number;

  @Column({ nullable: true, type: 'numeric', precision: 20, scale: 18 })
  closingBalance: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

}
