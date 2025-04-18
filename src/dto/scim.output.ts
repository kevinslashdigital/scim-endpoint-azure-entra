import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,
  IsNotEmpty,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ScimMeta,
  ScimUserEmail,
  ScimUserName,
  ScimUserRole,
} from '../entity/scim-user.entity';
import { SCIMGroupMember } from '../entity/scim-group.entity';

export class SCIMUserCreateOutput {
  @IsArray()
  @IsString({ each: true })
  schemas!: string[];

  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScimMeta)
  meta?: ScimMeta;

  @IsString()
  userName!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScimUserName)
  name?: ScimUserName;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ScimUserEmail)
  emails?: ScimUserEmail[];
}

export class SCIMNotFoundOutput {
  @IsArray()
  @IsString({ each: true })
  schemas!: string[];

  @IsString()
  status!: string;
}

export class SCIMGroupCreateOutput {
  @IsArray()
  @IsString({ each: true })
  schemas?: string[];

  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScimMeta)
  meta?: ScimMeta;

  @IsNotEmpty()
  @IsString()
  displayName!: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SCIMGroupMember)
  members?: SCIMGroupMember[];
}

export class SCIMListResource {
  @IsArray()
  @IsString({ each: true })
  schemas!: string[];

  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScimMeta)
  meta?: ScimMeta;

  @IsString()
  userName!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScimUserName)
  name?: ScimUserName;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ScimUserEmail)
  emails?: ScimUserEmail[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScimUserRole)
  roles!: ScimUserRole[];
}

export class SCIMUserList {
  @IsArray()
  @IsString({ each: true })
  schemas!: string[];

  @IsInt()
  totalResults!: number;

  @IsInt()
  startIndex!: number;

  @IsInt()
  itemsPerPage!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SCIMListResource)
  Resources!: SCIMListResource[];
}

export class SCIMGroupListResource {
  @IsArray()
  @IsString({ each: true })
  schemas!: string[];

  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScimMeta)
  meta?: ScimMeta;

  @IsString()
  displayName!: string;
}

export class SCIMGroupList {
  @IsArray()
  @IsString({ each: true })
  schemas!: string[];

  @IsInt()
  totalResults!: number;

  @IsInt()
  startIndex!: number;

  @IsInt()
  itemsPerPage!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SCIMGroupListResource)
  Resources: SCIMGroupListResource[];
}
