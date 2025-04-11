export class ScimMeta {
  resourceType?: string;

  location?: string;

  version?: string;

  created?: Date;

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
  primary!: string;

  display?: string;

  value?: string;

  type?: string;
}

export class ScimUserEmail {
  value!: string;

  type?: string;

  primary?: boolean;
}

export class ScimUserPhoneNumber {
  type!: string;

  value?: string;

  primary?: boolean;
}

export class ScimUserName {
  formatted?: string;

  familyName?: string;

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
