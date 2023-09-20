import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class FcmToken extends BaseEntity {
  @PrimaryColumn()
  token: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  lastCheckedAt: Date;

  @ManyToOne(() => User, (user) => user.fcmTokens, { nullable: true })
  user: User;

  @Column({ default: 0 })
  successCount: number;

  @Column({ default: 0 })
  failCount: number;

  @Column('simple-array', { nullable: true })
  errors: string[];
}
