import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tag } from './tag.entity';
import { User } from './user.entity';

@Entity()
export class Notice extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: 0 })
  views: number;

  @Column({ length: 3000 })
  body: string;

  @Column('datetime', { nullable: true })
  deadline: Date;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column('simple-array', { nullable: true })
  imagesUrl?: string[];

  @ManyToOne(() => User, (user) => user.uuid, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToMany(() => User, (user) => user.reminders)
  @JoinTable({
    name: 'notice_reminder',
    joinColumn: { name: 'notice_id' },
    inverseJoinColumn: { name: 'user_uuid' },
  })
  reminders: User[];

  @ManyToMany(() => Tag, (tag) => tag.notices, { eager: true })
  @JoinTable({
    name: 'notice_tag',
    joinColumn: { name: 'notice_id' },
    inverseJoinColumn: { name: 'tag_id' },
  })
  tags: Tag[];
}
