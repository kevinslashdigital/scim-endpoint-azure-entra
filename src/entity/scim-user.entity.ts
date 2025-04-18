import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  IsUrl,
  IsDate,
  IsNotEmpty,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ScimMeta {
  /** e.g. "User" or "Group" */
  @IsOptional()
  @IsString()
  resourceType?: string;

  /** URL of the resource */
  @IsOptional()
  @IsUrl()
  location?: string;

  /** Version identifier (e.g. an ETag) */
  @IsOptional()
  @IsString()
  version?: string;

  /** Creation timestamp (ISO8601 → Date) */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  created?: Date;

  /** Last‐modified timestamp (ISO8601 → Date) */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastModified?: Date;
}

export class ScimUserAddress {
  type!: string;

  formatted?: string;

  streetAddress?: string;

  locality?: string;

  region?: string;

  postalCode?: string;

  primary?: boolean;

  country?: string;
}

export class ScimUserRole {
  @IsNotEmpty()
  @IsString()
  primary!: string;

  /** Human‑readable name of the role */
  @IsOptional()
  @IsString()
  display?: string;

  /** The actual role value or code */
  @IsOptional()
  @IsString()
  value?: string;

  /** Category or type of the role */
  @IsOptional()
  @IsString()
  type?: string;
}

export class ScimUserEmail {
  /** The email address itself */
  @IsEmail()
  value!: string;

  /** Type of email (e.g. "work", "home") */
  @IsOptional()
  @IsString()
  type?: string;

  /** Whether this is the primary email */
  @IsOptional()
  @IsBoolean()
  primary?: boolean;
}

export class ScimUserPhoneNumber {
  type!: string;

  value?: string;

  primary?: boolean;
}

export class ScimUserName {
  @IsOptional()
  @IsString()
  formatted?: string;

  @IsOptional()
  @IsString()
  familyName?: string;

  @IsOptional()
  @IsString()
  givenName?: string;
}

export class SCIMUserEntity {
  id!: string;

  userName!: string;

  displayName!: string;

  externalId?: string;

  nickName?: string;

  profileUrl?: string;

  title?: string;

  userType?: string;

  preferredLanguage?: string;

  active?: boolean;

  groups?: string[];

  meta?: ScimMeta;

  addresses?: ScimUserAddress[];

  emails?: ScimUserEmail[];

  phoneNumbers?: ScimUserPhoneNumber[];

  schemas!: string[];

  roles?: ScimUserRole[];

  name?: ScimUserName;

  locale?: string;

  timezone?: string;

  isDeleted?: boolean;

  createdAt?: Date;

  updatedAt?: Date;

  deletedAt?: Date;
}

export class ScimOperation {
  op?: string;

  path?: string;

  value?: string;
}
