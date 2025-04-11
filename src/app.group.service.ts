import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SCIMGroupCreateInput, SCIMUserCreateInput } from './dto/scim.input';
import { SCIMUserCreateOutput, SCIMNotFoundOutput } from './dto/scim.output';
// import { SCIMUserEntity } from './entity/scim-user.entity';
// import { GroupRepository } from './group.reposiotry';

@Injectable()
export class AppGroupService {
  // private groupRepository: GroupRepository;

  getHello(): string {
    return 'Hello World!';
  }

  public async createSCIMUser(
    input: SCIMUserCreateInput,
  ): Promise<SCIMUserCreateOutput> {
    const duplicate = await this.checkUserNameExists(input.userName);

    if (duplicate) {
      throw new ConflictException(
        `User with userName "${input.userName}" already exists`,
      );
    }
    const payloadToCreate = {
      title: input.title,
      userType: input.userType,
      preferredLanguage: input.preferredLanguage,
      nickName: input.nickName,
      profileUrl: input.profileUrl,
      userName: input.userName,
      emails: input.emails,
      addresses: input.addresses,
      phoneNumbers: input.phoneNumbers,
      displayName: input.displayName,
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
      updatedAt: new Date(),
    };
    const user = await this.userRepository.save(payloadToCreate);
    return this.generateScimUserRespondFormat(user);
  }
  generateScimUserRespondFormat(
    user: any,
  ): SCIMUserCreateOutput | PromiseLike<SCIMUserCreateOutput> {
    throw new Error('Method not implemented.');
  }

  public async getSCIMUser(options: {
    id: string;
    userName?: string;
  }): Promise<SCIMUserCreateOutput | SCIMNotFoundOutput> {
    const user = await this.userRepository.findOne({
      where: {
        _id: new ObjectId(options.id),
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
      },
    });

    if (!user) {
      throw new NotFoundException(
        `This user ${options.id} has not bound to any azure ad`,
      );
    }

    return this.generateScimUserRespondFormat(user);
  }

  public async updateSCIMUser(
    id: string,
    workspaceId: string,
    input: SCIMUserUpdateInput,
  ): Promise<SCIMUserCreateOutput | SCIMNotFoundOutput> {
    await this.userRepository.updateOne(
      {
        _id: new ObjectId(id),
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
        workspaceId: workspaceId,
      },
      {
        $set: {
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
    const findResult = await this.userRepository.findOne({
      where: { _id: new ObjectId(id) },
    });

    return this.generateScimUserRespondFormat(findResult);
  }

  public async deleteSCIMUser(input: { id: ObjectId }): Promise<any> {
    const deletedUser = await this.userRepository.updateOne(
      {
        _id: new ObjectId(input.id),
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
        workspaceId: input.workspaceId,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
    );
    if (deletedUser.matchedCount === 0) {
      throw new NotFoundException(
        `This user ${input.id} has not bound to any azure ad`,
      );
    }
    // await this.scimUserRepository.delete({ id: input.id });

    return deletedUser.matchedCount > 0;
  }

  public async listScimUsers(filter: string): Promise<any> {
    const users = await this.userRepository.find({
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
      workspaceId,
    });
    let matchedUsers = users;
    if (filter) {
      const match = filter.match(/^userName\s+eq\s+"([^"]+)"$/i);
      if (match) {
        const filterValue = match[1].toLowerCase();
        matchedUsers = users.filter(
          (u) => u.userName.toLowerCase() === filterValue,
        );
      }
    }

    const totalResults = matchedUsers.length;

    const response = {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults,
      startIndex: 1,
      itemsPerPage: matchedUsers.length,
      Resources: matchedUsers.map((user) => ({
        ...user,
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        roles: this.transformUserRole(user.roles),
      })),
    };
    return response;
  }

  public async checkUserNameExists(userName: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: {
        userName,
      },
    });
    return !!user;
  }

  public async checkIdExists(id: ObjectId): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: {
        _id: new ObjectId(id),
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
      },
    });
    return !!user;
  }

  public transformUserRole(roles: SCIMUserEntity['roles']) {
    if (typeof roles !== 'object') {
      return roles;
    }
    const transformedRoles = roles.map((role) => ({
      primary: role.primary === 'True',
      display: role.display,
      value: role.value,
      type: role.type,
    }));
    return transformedRoles;
  }

  public async applyOperationsUser(id: string, Operations: any[]) {
    let user = await this.getSCIMUser({ id });

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

          await this.updateSCIMUser(id, updateInput);
        } else {
          // If path is a string like "emails[type eq \"work\"].value"
          // parse array sub-attribute with filter
          await this.applyReplaceOperation(id, path, value);
        }
      } else if (operation === 'add') {
        if (!path) {
          // No path => treat `value` as an object to merge at top-level
          const updateInput: SCIMUserUpdateInput = {
            ...(typeof value === 'object' && value !== null ? value : {}),
          };
          await this.updateSCIMUser(id, updateInput);
        } else {
          // parse sub-attribute, possibly array add
          await this.applyAddOperation(id, path, value);
        }
      } else {
        // For unhandled ops or unknown paths, you may return an error or ignore
        // return res.status(HttpStatus.BAD_REQUEST).json({ detail: `Unsupported op: ${operation}` });
      }
    }

    user = await this.getSCIMUser({ id });
    return user;
  }

  public async applyAddOperationGroup(
    id: string,
    workspaceId: string,
    path: string,
    value: any,
  ) {
    // If path is missing brackets, handle as a top-level field
    if (!path.includes('[')) {
      // For a top-level field like "active", or "displayName"
      // "add" typically means "set this field if it doesn't exist" or "merge if it does."
      const updateInput: SCIMUserUpdateInput = {
        [path]: value,
      };
      await this.updateSCIMUser(id, workspaceId, updateInput);
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
    const user = await this.getSCIMUser({ id });
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

    await this.updateSCIMUser(id, workspaceId, updateInput);
  }

  public async applyReplaceOperation(
    id: ObjectId,
    workspaceId: string,
    path: string,
    value: any,
  ) {
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

      await this.updateSCIMUser(id, workspaceId, updateInput);
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
    const user = await this.getSCIMUser({ id });
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
    await this.updateSCIMUser(id, workspaceId, updateInput);
  }

  public async createSCIMGroup(
    input: SCIMGroupCreateInput,
  ): Promise<SCIMGroupCreateOutput> {
    const existingGroup = await this.scimGroupRepository.findOne({
      where: { displayName: input.displayName },
    });
    if (existingGroup) {
      throw new ConflictException(
        `Group with displayName ${input.displayName} already exists`,
      );
    }
    // Find workspace for this tenantId
    const existingConnectedWorkspaces =
      await this.workspaceOIDCSettingDomainService.findWorkspaceOIDCSettings({
        workspaceId: new ObjectId(workspaceId),
        status: WorkspaceOIDCStatus.ACTIVE,
      });

    if (existingConnectedWorkspaces.length < 1) {
      throw new NotFoundException(
        `This workspaceId ${workspaceId} has not bound to any azure ad`,
      );
    }

    const existingOidcSettingForWorkspace = existingConnectedWorkspaces[0];

    const payloadToCreate = this.scimGroupRepository.create({
      displayName: input.displayName,
      members: input.members,
      externalId: input.externalId,
      workspaceId: workspaceId,
      schemas: input.schemas,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const savedPayload = await this.scimGroupRepository.save(payloadToCreate);

    await this.workspaceOIDCRoleMappingDomainService.createWorkspaceOIDCRoleMapping(
      {
        azureGroupId: input.externalId,
        workspaceId: workspaceId,
      },
      existingOidcSettingForWorkspace.updatedBy,
    );
    return this.generateScimGroupRespondFormat(savedPayload);
  }
  generateScimGroupRespondFormat(savedPayload: any): any {
    throw new Error('Method not implemented.');
  }

  public async getSCIMGroup(options: {
    id?: string;
    displayName?: string;
  }): Promise<SCIMGroupCreateOutput | SCIMNotFoundOutput> {
    const query: any = {
      _id: new ObjectId(options.id),
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    };
    // if (options.displayName) query.displayName = options.displayName;
    const group = await this.scimGroupRepository.findOne({
      where: query,
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${options.id} not found`);
    }
    return this.generateScimGroupRespondFormat(group);
  }

  public async listScimGroups(
    filter: string,
    startIndex: number,
    count: number,
  ): Promise<any> {
    const groups = await this.scimGroupRepository.find({
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
      workspaceId,
    });

    // Track if we're filtering by displayName
    let isDisplayNameFilter = false;
    let matchedGroups = groups;
    // Apply filters
    if (filter) {
      // Filter by displayName (case-insensitive)
      const displayNameMatch = filter.match(/displayName eq "(.*?)"/i);
      if (displayNameMatch) {
        isDisplayNameFilter = true;
        const displayName = displayNameMatch[1].toLowerCase();
        matchedGroups = groups?.filter(
          (group) => group.displayName.toLowerCase() === displayName,
        );
      }

      // Filter by id
      const idMatch = filter.match(/id eq "(.*?)"/i);
      if (idMatch) {
        const id = idMatch[1];
        matchedGroups = groups.filter((group) => group.id.toString() === id);
      }

      // Filter by externalId
      const externalIdMatch = filter.match(/externalId eq "(.*?)"/i);
      if (externalIdMatch) {
        const externalId = externalIdMatch[1];
        matchedGroups = groups.filter(
          (group) => group.externalId === externalId,
        );
      }
    }

    // Pagination support
    const start = Number(startIndex) - 1; // SCIM uses 1-based indexing
    const end = count !== undefined ? start + Number(count) : undefined;
    const paginatedGroups = matchedGroups.slice(start, end);

    // Format response - exclude members when filtering by displayName
    const filteredGroups = paginatedGroups.map((group) => {
      const baseResponse = {
        schemas: group.schemas,
        id: group.id,
        externalId: group.externalId,
        meta: group.meta,
        displayName: group.displayName,
      };

      // Only include members if they exist AND we're not filtering by displayName
      if (!isDisplayNameFilter && group.members) {
        return {
          ...baseResponse,
          members: group.members,
        };
      }
      return baseResponse;
    });
    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: filteredGroups.length,
      startIndex: Number(startIndex),
      itemsPerPage: count ? Number(count) : filteredGroups.length,
      Resources: filteredGroups,
    };
  }

  public async applyOperations(
    id: string,
    workspaceId: string,
    Operations: any[],
  ) {
    const group = await this.getSCIMGroupEntity({ id });

    if (!group) {
      throw new NotFoundException(
        `This group ${id} has not bound to any azure ad`,
      );
    }

    for (const op of Operations) {
      const operation = (op.op || '').toLowerCase();
      const path = op.path;
      const value = op.value;
      console.log('Operations', Operations);
      if (operation === 'replace') {
        if (!path) {
          // If path is not specified, SCIM often treats 'value' as a whole or partial user object
          // e.g. "op": "replace", "value": { "displayName": "New Name", ... }
          const updateInput: SCIMGroupUpdateInput = {
            ...(typeof value === 'object' && value !== null ? value : {}),
          };

          await this.updateSCIMGroup(id, updateInput, workspaceId);
        } else {
          // If path is a string like "emails[type eq \"work\"].value"
          // parse array sub-attribute with filter
          await this.applyReplaceOperation(id, workspaceId, path, value);
        }
      } else if (operation === 'add') {
        if (!path) {
          // No path => treat `value` as an object to merge at top-level
          const updateInput: SCIMGroupUpdateInput = {
            ...(typeof value === 'object' && value !== null ? value : {}),
          };
          await this.updateSCIMGroup(id, updateInput, workspaceId);
        } else {
          // parse sub-attribute, possibly array add
          await this.applyAddOperation(id, workspaceId, path, value);
        }
      } else if (operation === 'remove') {
        if (!path) {
          // No path => treat `value` as an object to merge at top-level
          const updateInput: SCIMGroupUpdateInput = {
            ...(typeof value === 'object' && value !== null ? value : {}),
          };
          await this.updateSCIMGroup(id, updateInput, workspaceId);
        } else {
          // parse sub-attribute, possibly array add
          await this.applyRemoveOperation(id, workspaceId, path, value);
        }
      } else {
        // For unhandled ops or unknown paths, you may return an error or ignore
        // return res.status(HttpStatus.BAD_REQUEST).json({ detail: `Unsupported op: ${operation}` });
      }
    }

    return await this.getSCIMGroup({ id });
  }

  public async applyAddOperation(
    id: string,
    workspaceId: string,
    path: string,
    value: any,
  ) {
    if (path !== 'members' || !Array.isArray(value)) {
      const updateInput: SCIMGroupUpdateInput = {
        [path]: value,
      };
      await this.updateSCIMGroup(id, updateInput, workspaceId);
      return;
    }

    // Fetch group
    const group = await this.getSCIMGroupEntity({ id });
    if (!group) return;

    const members: any = group.members || [];

    const memberExists = members.find((m: any) => m.value === value[0].value);

    let newMembers: any = [];

    if (!memberExists) {
      newMembers = value.map((m) => ({
        value: m.value,
        display: m.display,
        type: m.type,
        $ref: m.$ref,
      }));
    }

    const membersUpdate = [...members, ...newMembers];

    // Save
    const updateInput: SCIMGroupUpdateInput = {
      [path]: membersUpdate,
    };
    await this.updateSCIMGroup(id, updateInput, workspaceId);
  }

  public async applyRemoveOperation(
    id: string,
    workspaceId: string,
    path: string,
    value: any,
  ) {
    if (path !== 'members' || !Array.isArray(value)) {
      const updateInput: SCIMGroupUpdateInput = {
        [path]: value,
      };
      await this.updateSCIMGroup(id, updateInput, workspaceId);
      return;
    }

    // Fetch group
    const group = await this.getSCIMGroupEntity({ id });
    if (!group) return;

    const members: any = group.members;

    const removeIds = value
      .filter((m): m is { value: string } => m?.value !== undefined)
      .map((m) => m.value);
    const membersUpdate = members.filter(
      (m: any) => !removeIds.includes(m.value),
    );

    // Save
    const updateInput: SCIMGroupUpdateInput = {
      [path]: membersUpdate,
    };
    await this.updateSCIMGroup(id, updateInput, workspaceId);
  }

  public async applyReplaceOperation(
    id: string,
    workspaceId: string,
    path: string,
    value: any,
  ) {
    if (value === undefined || value === null || value === '') {
      return;
    }
    const updateInput: SCIMGroupUpdateInput = {
      [path]: value,
    };

    await this.updateSCIMGroup(id, updateInput, workspaceId);
  }

  public async getSCIMGroupEntity(options: {
    id?: string;
    displayName?: string;
  }): Promise<SCIMGroupEntity | null> {
    const query: any = {
      _id: new ObjectId(options.id),
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    };

    // if (options.id) query._id = new ObjectId(options.id);
    // if (options.displayName) query.displayName = options.displayName;

    return await this.scimGroupRepository.findOne({ where: query });
  }

  public async updateSCIMGroup(
    id: string,
    input: SCIMGroupUpdateInput,
    workspaceId: string,
  ): Promise<SCIMGroupCreateOutput | SCIMNotFoundOutput> {
    // Find workspace for this tenantId
    // const existingConnectedWorkspaces =
    //   await this.workspaceOIDCSettingDomainService.findWorkspaceOIDCSettings({
    //     workspaceId: new ObjectId(workspaceId),
    //     status: WorkspaceOIDCStatus.ACTIVE,
    //   });

    // if (existingConnectedWorkspaces.length < 1) {
    //   throw new NotFoundException(
    //     `This workspaceId ${workspaceId} has not bound to any azure ad`
    //   );
    // }

    // const existingOidcSettingForWorkspace = existingConnectedWorkspaces[0];

    const groupIndex = await this.getSCIMGroup({ id });
    if (!groupIndex) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    // const existingGroup = await this.getSCIMGroup({
    //   displayName: input.displayName,
    // });
    // if (existingGroup) {
    //   throw new ConflictException(
    //     `Group with displayName ${input.displayName} already exists`
    //   );
    // }

    await this.scimGroupRepository.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
    const findResult = await this.scimGroupRepository.findOne({
      where: { _id: new ObjectId(id) },
    });
    if (!findResult) {
      return this.generateScimNotFound();
    }
    return this.generateScimGroupRespondFormat(findResult);
  }
  generateScimNotFound(): any {
    throw new Error('Method not implemented.');
  }

  public async deleteSCIMGroup(id: string): Promise<boolean> {
    // const group = await this.getSCIMGroup({ id });
    // if (!group) {
    //   return false;
    // }

    const deletedGroup = await this.scimGroupRepository.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          // Also update meta if you have SCIM meta fields
          meta: {
            // ...(group as SCIMGroupCreateOutput).meta,
            lastModified: new Date().toISOString(),
            resourceType: 'Group',
            location: null, // Remove location for deleted resources
          },
        },
      },
    );
    if (deletedGroup.matchedCount === 0) {
      throw new NotFoundException(
        `This group ${id} has not bound to any azure ad`,
      );
    }
    return deletedGroup.modifiedCount > 0;
  }

  public async listScimGroupForWorkspace(options: {
    workspaceId?: string;
    tenantId?: string;
  }): Promise<SCIMGroupEntity[]> {
    const existingConnectedWorkspaces =
      await this.workspaceOIDCSettingDomainService.findWorkspaceOIDCSettings({
        workspaceId: new ObjectId(options.workspaceId),
        tenantId: options.tenantId,
        status: WorkspaceOIDCStatus.ACTIVE,
      });
    if (existingConnectedWorkspaces.length < 0) {
      throw new UnauthorizedException(
        'This workspace is not bounded to any Azure Tenant yet',
      );
    }
    const allGroupForTenant = await this.scimGroupRepository.find({
      where: {
        tenantId: existingConnectedWorkspaces[0].tenantId,
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
      },
    });
    return allGroupForTenant;
  }

  public async checkGroupExists(displayName: string): Promise<boolean> {
    const existingGroup = await this.scimGroupRepository.findOne({
      where: { displayName },
    });
    return !!existingGroup; // Return true if group exists, false otherwise
  }
}
