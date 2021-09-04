import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({})
  address: string;

  @Column({ nullable: true, type: 'numeric', precision: 20, scale: 18 })
  balance: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // @Column({ default: true })
  // isActive: boolean;
}
