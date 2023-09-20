import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Notice } from './notice.entity';
import { FcmToken } from './fcmToken.entity';

@Entity()
export class User extends BaseEntity {
  @PrimaryColumn('uuid')
  uuid: string;

  @Column()
  name: string;

  @Column()
  consent: boolean;

  @OneToMany(() => FcmToken, (fcmToken) => fcmToken.user)
  fcmTokens: FcmToken[];

  @ManyToMany(() => Notice, (notice) => notice.reminders)
  reminders: Notice[];
}
