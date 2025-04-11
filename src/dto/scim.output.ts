import {
  ScimMeta,
  ScimUserEmail,
  ScimUserName,
} from '../entity/scim-user.entity';
import { SCIMGroupMember } from '../entity/scim-group.entity';

export class SCIMUserCreateOutput {
  schemas!: string[];

  id!: string;

  externalId?: string;

  meta?: ScimMeta;

  userName!: string;

  name?: ScimUserName;

  active?: boolean;

  emails?: ScimUserEmail[];
}

export class SCIMNotFoundOutput {
  schemas!: string[];

  status!: string;
}

export class SCIMGroupCreateOutput {
  schemas!: string[];

  id!: string;

  externalId?: string;

  meta?: ScimMeta;

  displayName!: string;

  members?: SCIMGroupMember[];
}
