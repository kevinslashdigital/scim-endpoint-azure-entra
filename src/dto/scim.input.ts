import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import { OmitType } from '@nestjs/mapped-types';

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
  @IsArray()
  @IsString({ each: true })
  schemas!: string[];

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsNotEmpty()
  @IsString()
  userName!: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  nickName?: string;

  @IsOptional()
  @IsString()
  profileUrl?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  userType?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ScimUserEmail)
  emails?: ScimUserEmail[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ScimUserAddress)
  addresses?: ScimUserAddress[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ScimUserPhoneNumber)
  phoneNumbers?: ScimUserPhoneNumber[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groups?: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ScimUserRole)
  roles?: ScimUserRole[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ScimMeta)
  meta?: ScimMeta;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScimUserName)
  name?: ScimUserName;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  resourceType?: string;
}

export class SCIMUserUpdatePartialInput {
  @IsOptional()
  Operations?: ScimOperation[];

  @IsOptional()
  schemas?: string[];
}

export class SCIMGroupCreateInput {
  @IsNotEmpty()
  displayName!: string;

  @IsNotEmpty()
  @IsOptional()
  externalId?: string;

  @IsOptional()
  members?: SCIMGroupMember[];

  @IsOptional()
  schemas?: string[];

  @IsOptional()
  meta?: ScimMeta;
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

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class SCIMUserUpdateInput extends OmitType(SCIMUserCreateInput, [
  'userName',
  'schemas',
] as const) {
  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  schemas?: string[];
}

export class SCIMGroupUpdateInput extends OmitType(SCIMGroupCreateInput, [
  'displayName',
] as const) {
  @IsOptional()
  @IsString()
  displayName?: string;
}
