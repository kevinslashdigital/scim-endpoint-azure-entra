import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ScimMeta } from './scim-user.entity';

export class SCIMGroupMember {
  @Field()
  @Directive('@shareable')
  value!: string;

  @Field({ nullable: true })
  @Directive('@shareable')
  display?: string;
}

@Entity('scimGroup')
@ObjectType()
@Directive('@key(fields: "id")')
export class SCIMGroupEntity {
  @ObjectIdColumn()
  @Field(() => ID)
  @Directive('@shareable')
  id!: ObjectId;

  @Column()
  @Field()
  @Directive('@shareable')
  externalId!: string;

  @Column()
  @Field()
  @Directive('@shareable')
  displayName!: string;

  @Column()
  @Field(() => [SCIMGroupMember], { nullable: true})
  @Directive('@shareable')
  members?: SCIMGroupMember[];

  @Column()
  @Field(() => ScimMeta, { nullable: true})
  @Directive('@shareable')
  meta?: ScimMeta;

  @Column()
  @Field(() => [String])
  @Directive('@shareable')
  schemas!: string[];

  @Column()
  @Field({nullable: true})
  @Directive('@shareable')
  workspaceId?: string;

  @Column({ default: false })
  @Field({ nullable: true })
  @Directive('@shareable')
  isDeleted?: boolean;

  @CreateDateColumn({ nullable: true })
  @Field({ nullable: true })
  @Directive('@shareable')
  createdAt?: Date;

  @UpdateDateColumn({ nullable: true })
  @Field({ nullable: true })
  @Directive('@shareable')
  updatedAt?: Date;

  @Column({ nullable: true })
  @Field(() => Date, { nullable: true })
  @Directive('@shareable')
  deletedAt?: Date;
}
