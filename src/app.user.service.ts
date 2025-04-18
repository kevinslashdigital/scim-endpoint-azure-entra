import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SCIMUserCreateInput, SCIMUserUpdateInput } from './dto/scim.input';
import {
  SCIMNotFoundOutput,
  SCIMUserCreateOutput,
  SCIMUserList,
} from './dto/scim.output';
import {
  ScimOperation,
  SCIMUserEntity,
  ScimUserRole,
} from './entity/scim-user.entity';
import { UserRepository } from './user.reposiotry';

@Injectable()
export class AppUserService {
  // @InjectRepository(SCIMUserEntity)
  constructor(private readonly userRepository: UserRepository) {}

  public createSCIMUser(input: SCIMUserCreateInput): SCIMUserCreateOutput {
    const duplicate = this.checkUserNameExists(input.userName);

    if (duplicate) {
      throw new ConflictException(
        `User with userName "${input.userName}" already exists`,
      );
    }
    const payloadToCreate: SCIMUserEntity = {
      id: new Date().getTime().toString(),
      title: input.title,
      userType: input.userType,
      preferredLanguage: input.preferredLanguage,
      nickName: input.nickName,
      profileUrl: input.profileUrl,
      userName: input.userName,
      emails: input.emails,
      addresses: input.addresses,
      phoneNumbers: input.phoneNumbers,
      displayName: input.displayName ?? '',
      externalId: input.externalId,
      schemas: input.schemas,
      active: input.active,
      roles: input.roles,
      name: input.name,
      locale: input.locale,
      timezone: input.timezone,
      meta: {
        ...input.meta,
        created: new Date(),
        lastModified: new Date(),
      },
      groups: input.groups,
      createdAt: new Date(),
    };
    const user: SCIMUserEntity = this.userRepository.save(payloadToCreate);
    return this.generateScimUserRespondFormat(user);
  }
  private generateScimUserRespondFormat(
    payload: SCIMUserEntity | null,
  ): SCIMUserCreateOutput {
    if (!payload) {
      return {} as SCIMUserCreateOutput;
    }
    return {
      ...payload,
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      id: payload.id.toString(),
    };
  }
  public getSCIMUser(options: {
    id: string;
    userName?: string;
  }): SCIMUserCreateOutput | SCIMNotFoundOutput {
    const user = this.userRepository.findOne({
      where: {
        id: options.id,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `This user ${options.id} has not bound to any azure ad`,
      );
    }

    return this.generateScimUserRespondFormat(user);
  }

  public listScimUsers(filter?: string): SCIMUserList {
    const users = this.userRepository.find();
    let matchedUsers: SCIMUserEntity[] = users;
    if (filter) {
      const match = filter.match(/^userName\s+eq\s+"([^"]+)"$/i);
      if (match) {
        const filterValue = match[1].toLowerCase();
        matchedUsers = users.filter(
          (u: { userName: string }) => u.userName.toLowerCase() === filterValue,
        );
      }
    }

    const totalResults = matchedUsers.length;

    const response: SCIMUserList = {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults,
      startIndex: 1,
      itemsPerPage: matchedUsers.length,
      Resources: matchedUsers.map((user: SCIMUserEntity) => ({
        ...user,
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        roles: this.transformUserRole(user.roles),
      })),
    };
    return response;
  }

  public deleteSCIMUser(input: { id: string }): boolean {
    const deletedUser = this.userRepository.delete({
      id: input.id,
    });
    if (deletedUser.matchedCount === 0) {
      throw new NotFoundException(
        `This user ${input.id} has not bound to any azure ad`,
      );
    }
    // await this.scimUserRepository.delete({ id: input.id });

    return deletedUser.matchedCount > 0;
  }

  public updateSCIMUser(
    id: string,
    input: SCIMUserUpdateInput,
  ): SCIMUserCreateOutput | SCIMNotFoundOutput {
    this.userRepository.updateOne(
      {
        id,
      },
      {
        set: {
          ...input,
          userName: input.userName ?? '',
          schemas: input.schemas ?? [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
    const findResult = this.userRepository.findOne({
      where: { id: id },
    });

    return this.generateScimUserRespondFormat(findResult);
  }

  private checkUserNameExists(userName: string): boolean {
    const user: SCIMUserEntity = this.userRepository.findOne({
      where: {
        userName,
      },
    });
    return !!user;
  }

  // public async checkIdExists(id: ObjectId): Promise<boolean> {
  //   const user = await this.userRepository.findOne({
  //     where: {
  //       _id: new ObjectId(id),
  //       $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
  //     },
  //   });
  //   return !!user;
  // }

  private transformUserRole(roles?: ScimUserRole[]): ScimUserRole[] {
    if (typeof roles !== 'object') {
      return roles || [];
    }
    const transformedRoles = roles.map((role) => ({
      primary: role.primary === 'True' ? 'True' : 'False',
      display: role.display,
      value: role.value,
      type: role.type,
    }));
    return transformedRoles;
  }

  public applyOperations(id: string, Operations: ScimOperation[]) {
    let user = this.getSCIMUser({ id });

    if (!user) {
      throw new NotFoundException(
        `This user ${id} has not bound to any azure ad`,
      );
    }

    for (const op of Operations) {
      const operation = (op.op || '').toLowerCase();
      const path = op.path; // e.g. emails[type eq "work"].value
      const value = op.value;
      // Only handling "replace" here. You can add "add"/"remove" if needed.
      if (operation === 'replace') {
        if (!path) {
          // If path is not specified, SCIM often treats 'value' as a whole or partial user object
          // e.g. "op": "replace", "value": { "displayName": "New Name", ... }
          const updateInput: SCIMUserUpdateInput = {
            ...(typeof value === 'object' && value !== null ? value : {}),
          };

          this.updateSCIMUser(id, updateInput);
        } else {
          // If path is a string like "emails[type eq \"work\"].value"
          // parse array sub-attribute with filter
          this.applyReplaceOperation(id, path, value);
        }
      } else if (operation === 'add') {
        if (!path) {
          // No path => treat `value` as an object to merge at top-level
          const updateInput: SCIMUserUpdateInput = {
            ...(typeof value === 'object' && value !== null ? value : {}),
          };
          this.updateSCIMUser(id, updateInput);
        } else {
          // parse sub-attribute, possibly array add
          this.applyAddOperation(id, path, value);
        }
      } else {
        // For unhandled ops or unknown paths, you may return an error or ignore
        // return res.status(HttpStatus.BAD_REQUEST).json({ detail: `Unsupported op: ${operation}` });
      }
    }

    user = this.getSCIMUser({ id });
    return user;
  }

  private applyAddOperation(id: string, path: string, value: any) {
    // If path is missing brackets, handle as a top-level field
    if (!path.includes('[')) {
      // For a top-level field like "active", or "displayName"
      // "add" typically means "set this field if it doesn't exist" or "merge if it does."
      const updateInput: SCIMUserUpdateInput = {
        [path]: value,
      };
      this.updateSCIMUser(id, updateInput);
      return;
    }

    // path might be e.g. "emails[type eq \"work\"].value"
    const [arrayName, bracketRest] = path.split('[');
    // arrayName = "emails", bracketRest = "type eq \"work\"].value"

    const [filterPart, subAttrPart] = bracketRest.split(']');
    // filterPart = "type eq \"work\"", subAttrPart = ".value"

    const match = filterPart.match(/(type|primary)\s+eq\s+"([^"]+)"/i);
    if (!match) {
      // filter not recognized
      return;
    }

    const filterKey = match[1]; // "type" or "primary"
    let filterValue = match[2]; // "work" or "True", etc.

    // Convert string "True"/"False" if needed
    if (filterValue.toLowerCase() === 'true') filterValue = 'True';
    if (filterValue.toLowerCase() === 'false') filterValue = 'False';

    // subAttrPart might be ".value" => subAttr = "value"
    const subAttr = subAttrPart.startsWith('.')
      ? subAttrPart.slice(1)
      : subAttrPart;

    // Fetch user
    const user = this.getSCIMUser({ id });
    if (!user) return;

    // Get the array, e.g. user.emails
    // const arr:any = user[arrayName] || [];

    const arr: any =
      (user as SCIMUserCreateOutput)[arrayName as keyof SCIMUserCreateOutput] ||
      [];

    // Find index of item that matches filterKey = filterValue
    const index = arr.findIndex((item: any) => item[filterKey] === filterValue);

    // const index = arr.findIndex(
    //   (item: any) => item[filterKey as keyof typeof item] === filterValue
    // );

    if (index === -1) {
      // We have no existing item with that filter, so "add" means create new
      const newItem: any = {};
      newItem[filterKey] = filterValue; // e.g. { type: 'work' }
      newItem[subAttr] = value; // e.g. { value: 'someone@example.com' }
      arr.push(newItem);
    } else {
      // We do have an item => update/merge
      arr[index][subAttr] = value;
    }

    // Save
    const updateInput: SCIMUserUpdateInput = {
      [arrayName]: arr,
    };

    this.updateSCIMUser(id, updateInput);
  }

  private applyReplaceOperation(id: string, path: string, value: any) {
    // For example, path might be: "emails[type eq \"work\"].value"
    // 1) Split on '[' -> "emails" + "type eq \"work\"].value"
    // 2) Then split on ']' -> "type eq \"work\"" + ".value"
    // 3) Parse 'type eq "work"' to find type="work"
    // 4) subAttr = "value"

    // If there's no bracket, then it's a simple property like "active" or "displayName"
    if (!path.includes('[')) {
      // handle simple field updates
      const updateInput: SCIMUserUpdateInput = {
        [path]: value,
      };

      this.updateSCIMUser(id, updateInput);
      return;
    }

    // Split on '['
    const [arrayName, bracketRest] = path.split('[');
    // arrayName = "emails"
    // bracketRest = "type eq \"work\"].value"

    // Now split bracketRest on ']'
    const [filterPart, subAttrPart] = bracketRest.split(']');
    // filterPart = "type eq \"work\""
    // subAttrPart = ".value"

    // parse filter, e.g. 'type eq "work"' or 'primary eq "True"'
    // This is minimal; you might want more robust parsing for other operators
    const filterMatch = filterPart.match(/(type|primary)\s+eq\s+"([^"]+)"/i);
    if (!filterMatch) {
      // filter not recognized, do nothing or handle error
      return;
    }
    const filterKey = filterMatch[1]; // e.g. "type" or "primary"
    let filterValue = filterMatch[2]; // e.g. "work" or "True"

    // handle booleans, e.g. primary eq "True" => primary = true
    if (filterValue.toLowerCase() === 'true') {
      filterValue = 'True';
    } else if (filterValue.toLowerCase() === 'false') {
      filterValue = 'False';
    }

    // subAttrPart might be ".value" => subAttr = "value"
    const subAttr = subAttrPart.startsWith('.')
      ? subAttrPart.slice(1)
      : subAttrPart;

    // fetch user
    const user = this.getSCIMUser({ id });
    if (!user) {
      return; // user not found
    }

    // get the array, e.g. user.emails
    // const arr = user[arrayName] || [];
    const arr: any =
      (user as SCIMUserCreateOutput)[arrayName as keyof SCIMUserCreateOutput] ||
      [];

    // find the index of the item that matches filterKey = filterValue
    const index = arr.findIndex((item: any) => item[filterKey] === filterValue);
    if (index === -1) {
      // no matching item; could do "add" logic if desired
      return;
    }

    // update that subAttr for the matched item
    arr[index][subAttr] = value;

    // Save
    const updateInput: SCIMUserUpdateInput = {
      [arrayName]: arr,
    };
    this.updateSCIMUser(id, updateInput);
  }
}
