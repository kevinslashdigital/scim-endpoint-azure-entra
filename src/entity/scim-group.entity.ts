import { ScimMeta } from './scim-user.entity';

export class SCIMGroupMember {
  value!: string;

  display?: string;
}

export class SCIMGroupEntity {
  id!: string;

  externalId?: string;

  displayName!: string;

  members?: SCIMGroupMember[];

  meta?: ScimMeta;

  schemas?: string[];

  workspaceId?: string;

  isDeleted?: boolean;

  createdAt?: Date;

  updatedAt?: Date;

  deletedAt?: Date;
}
