import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  blockNumber: string;

  @Column()
  blockHash: string;

  @Column()
  nonce: string;

  @Column()
  hash: string;

  @Index()
  @Column()
  from: string;

  @Index()
  @Column()
  to: string;

  @Index()
  @Column({ type: 'numeric', precision: 20, scale: 18 })
  value: number;

  @Column()
  confirmations: number;

  @Column()
  timeStamp: Date;

  @Column({ nullable: true })
  isError: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
