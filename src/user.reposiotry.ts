import { Injectable } from '@nestjs/common';
import {
  ScimMeta,
  ScimUserAddress,
  ScimUserEmail,
  SCIMUserEntity,
  ScimUserName,
  ScimUserPhoneNumber,
  ScimUserRole,
} from './entity/scim-user.entity';
import {
  FindOneOption,
  DeleteOption,
  DeleteResponse,
} from './entity/user.repository.entity';

@Injectable()
export class UserRepository {
  private users: SCIMUserEntity[] = [];
  public save(user: SCIMUserEntity): SCIMUserEntity {
    this.users.push(user);
    return user;
  }

  public findOne(option: FindOneOption): SCIMUserEntity {
    const { userName, id } = option.where;
    const user = this.users.find(
      (user) => user.userName === userName || user.id === id,
    );
    return user as SCIMUserEntity;
  }

  public find(): SCIMUserEntity[] {
    return this.users;
  }

  public delete(option: DeleteOption): DeleteResponse {
    const { id } = option;
    const users: SCIMUserEntity[] = this.users.filter((user) => user.id != id);
    return {
      matchedCount: this.users.length - users.length,
    };
  }
  public updateOne(
    where: { id: string },
    option: {
      set: {
        createdAt: Date;
        updatedAt: Date;
        schemas: string[];
        externalId?: string;
        userName: string;
        displayName?: string;
        nickName?: string;
        profileUrl?: string;
        title?: string;
        userType?: string;
        preferredLanguage?: string;
        active?: boolean;
        emails?: ScimUserEmail[];
        addresses?: ScimUserAddress[];
        phoneNumbers?: ScimUserPhoneNumber[];
        groups?: string[];
        roles?: ScimUserRole[];
        meta?: ScimMeta;
        name?: ScimUserName;
        locale?: string;
        timezone?: string;
        resourceType?: string;
      };
    },
  ) {
    // Find the index of the user to update
    const idx = this.users.findIndex((u) => u.id === where.id);
    if (idx === -1) {
      throw new Error(`User with id=${where.id} not found`);
    }

    // Merge existing user with the $set fields
    const updated = {
      ...this.users[idx],
      ...option.set,
    };

    // Replace in the array
    this.users[idx] = updated;

    return updated;
  }
}
