import { IsNotEmpty, IsOptional } from 'class-validator';

import {
  ScimMeta,
  ScimOperation,
  ScimUserAddress,
  ScimUserEmail,
  ScimUserName,
  ScimUserPhoneNumber,
  ScimUserRole,
} from '../entity/scim-user.entity';

import { SCIMGroupMember } from '../entity/scim-group.entity';

export class SCIMUserCreateInput {
  @IsNotEmpty()
  userName!: string;

  @IsOptional()
  externalId?: string;

  displayName!: string;

  @IsOptional()
  nickName?: string;

  @IsOptional()
  profileUrl?: string;

  @IsOptional()
  title?: string;

  @IsOptional()
  userType?: string;

  @IsOptional()
  preferredLanguage?: string;

  @IsOptional()
  active?: boolean;

  @IsOptional()
  emails?: ScimUserEmail[];

  @IsOptional()
  addresses?: ScimUserAddress[];

  @IsOptional()
  phoneNumbers?: ScimUserPhoneNumber[];

  @IsOptional()
  groups?: string[];

  schemas!: string[];

  @IsOptional()
  roles?: ScimUserRole[];

  meta?: ScimMeta;

  name?: ScimUserName;

  locale?: string;

  timezone?: string;
  resourceType: string;
}

export class SCIMUserUpdatePartialInput {
  @IsOptional()
  Operations?: ScimOperation[];
}

export class SCIMGroupCreateInput {
  @IsNotEmpty()
  displayName!: string;

  @IsNotEmpty()
  externalId!: string;

  @IsOptional()
  members?: SCIMGroupMember[];

  schemas!: string[];
}


export class SearchDto {
  @IsOptional()
  filter?: string;

  @IsOptional()
  sortBy?: string;

  @IsOptional()
  sortOrder?: 'ascending' | 'descending';

  @IsOptional()
  startIndex?: number;

  @IsOptional()
  count?: number;

  @IsOptional()
  excludedAttributes?: boolean;

  @IsOptional()
  attributes?: string[];
}

export class SCIMGroupPatchMemberOperation {
  @IsNotEmpty()
  value!: string;

  @IsOptional()
  display?: string;

  @IsOptional()
  type?: string;

  @IsOptional()
  $ref?: string;
}

export class SCIMGroupPatchOperationValue {
  @IsOptional()
  displayName?: string;

  @IsOptional()
  externalId?: string;
}

export class SCIMGroupPatchOperation {
  @IsNotEmpty()
  op!: 'add' | 'remove' | 'replace';

  @IsOptional()
  path?: string;

  @IsOptional()
  stringValue?: string;

  @IsOptional()
  objectValue?: SCIMGroupPatchOperationValue;

  @IsOptional()
  arrayValue?: SCIMGroupPatchMemberOperation[];

  // Helper method to get the appropriate value
  get value():
    | string
    | SCIMGroupPatchOperationValue
    | SCIMGroupPatchMemberOperation[]
    | undefined {
    return this.stringValue ?? this.objectValue ?? this.arrayValue;
  }
}
