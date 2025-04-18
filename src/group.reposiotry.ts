import { Injectable } from '@nestjs/common';
import {
  FindOneOption,
  DeleteOption,
  DeleteResponse,
} from './entity/user.repository.entity';
import { SCIMGroupEntity, SCIMGroupMember } from './entity/scim-group.entity';

@Injectable()
export class GroupRepository {
  private groups: SCIMGroupEntity[] = [];
  public save(group: SCIMGroupEntity): SCIMGroupEntity {
    this.groups.push(group);
    return group;
  }

  public findOne(option: FindOneOption): SCIMGroupEntity {
    const { displayName, id } = option.where;
    const group = this.groups.find(
      (group) => group.displayName === displayName || group.id === id,
    );
    return group as SCIMGroupEntity;
  }

  public find(): SCIMGroupEntity[] {
    return this.groups;
  }

  public delete(option: DeleteOption): DeleteResponse {
    const { id } = option;
    const users: SCIMGroupEntity[] = this.groups.filter(
      (group) => group.id != id,
    );
    return {
      matchedCount: this.groups.length - users.length,
    };
  }
  public updateOne(
    where: { id: string },
    option: {
      set: {
        createdAt: Date;
        updatedAt: Date;
        schemas?: string[];
        externalId?: string;
        displayName?: string;
        members?: SCIMGroupMember[];
      };
    },
  ) {
    // Find the index of the user to update
    const idx = this.groups.findIndex((u) => u.id === where.id);
    if (idx === -1) {
      throw new Error(`User with id=${where.id} not found`);
    }

    // Merge existing user with the $set fields
    const updated = {
      ...this.groups[idx],
      ...option.set,
    };

    // Replace in the array
    this.groups[idx] = updated;

    return updated;
  }
}
