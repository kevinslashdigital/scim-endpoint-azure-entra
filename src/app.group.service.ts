import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SCIMGroupCreateInput, SCIMGroupUpdateInput } from './dto/scim.input';
import { SCIMNotFoundOutput, SCIMGroupCreateOutput, SCIMGroupList } from './dto/scim.output';
import { GroupRepository } from './group.reposiotry';
import { SCIMGroupEntity } from './entity/scim-group.entity';

@Injectable()
export class AppGroupService {
  constructor(private readonly groupRepository: GroupRepository) {}

  public createSCIMGroup(input: SCIMGroupCreateInput): SCIMGroupCreateOutput {
    const duplicate = this.groupRepository.findOne({
      where: { displayName: input.displayName },
    });
    if (duplicate) {
      throw new ConflictException(
        `Group with displayName ${input.displayName} already exists`,
      );
    }
    const payloadToCreate: SCIMGroupEntity = {
      id: new Date().getTime().toString(),
      displayName: input.displayName,
      members: input.members,
      externalId: input.externalId,
      schemas: input.schemas,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const group: SCIMGroupEntity = this.groupRepository.save(payloadToCreate);
    return this.generateScimGroupRespondFormat(group);
  }
  private generateScimGroupRespondFormat(
    payload: SCIMGroupEntity | null,
  ): SCIMGroupCreateOutput {
    if (!payload) {
      return {} as SCIMGroupCreateOutput;
    }
    return {
      id: payload.id.toString(),
      schemas: payload.schemas,
      externalId: payload.externalId,
      meta: payload.meta,
      displayName: payload.displayName,
    };
  }

  public getSCIMGroup(options: {
    id?: string;
    displayName?: string;
  }): SCIMGroupCreateOutput | SCIMNotFoundOutput {
    const group = this.groupRepository.findOne({
      where: { id: options.id },
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${options.id} not found`);
    }
    return this.generateScimGroupRespondFormat(group);
  }

  public listScimGroups(
    startIndex: number,
    count?: number,
    filter?: string,
  ): SCIMGroupList {
    const groups = this.groupRepository.find();
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
        schemas: group.schemas || [],
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

  public updateSCIMGroup(
    id: string,
    input: SCIMGroupUpdateInput,
  ): SCIMGroupCreateOutput | SCIMNotFoundOutput {
    const groupIndex = this.getSCIMGroup({ id });
    if (!groupIndex) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    this.groupRepository.updateOne(
      {
        id,
      },
      {
        set: {
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
    const findResult = this.groupRepository.findOne({
      where: { id },
    });
    return this.generateScimGroupRespondFormat(findResult);
  }

  public deleteSCIMGroup(id: string): boolean {
    const deletedGroup = this.groupRepository.delete({
      id,
    });
    if (deletedGroup.matchedCount === 0) {
      throw new NotFoundException(
        `This group ${id} has not bound to any azure ad`,
      );
    }
    return deletedGroup.matchedCount > 0;
  }

  public applyOperations(id: string, Operations: any[]) {
    const group = this.getSCIMGroupEntity({ id });

    if (!group) {
      throw new NotFoundException(
        `This group ${id} has not bound to any azure ad`,
      );
    }

    for (const op of Operations) {
      const operation = (op.op || '').toLowerCase();
      const path = op.path;
      const value = op.value;
      if (operation === 'replace') {
        if (!path) {
          // If path is not specified, SCIM often treats 'value' as a whole or partial user object
          // e.g. "op": "replace", "value": { "displayName": "New Name", ... }
          const updateInput: SCIMGroupUpdateInput = {
            ...(typeof value === 'object' && value !== null ? value : {}),
          };

          this.updateSCIMGroup(id, updateInput);
        } else {
          // If path is a string like "emails[type eq \"work\"].value"
          // parse array sub-attribute with filter
          this.applyReplaceOperation(id, path, value);
        }
      } else if (operation === 'add') {
        if (!path) {
          // No path => treat `value` as an object to merge at top-level
          const updateInput: SCIMGroupUpdateInput = {
            ...(typeof value === 'object' && value !== null ? value : {}),
          };
          this.updateSCIMGroup(id, updateInput);
        } else {
          // parse sub-attribute, possibly array add
          this.applyAddOperation(id, path, value);
        }
      } else if (operation === 'remove') {
        if (!path) {
          // No path => treat `value` as an object to merge at top-level
          const updateInput: SCIMGroupUpdateInput = {
            ...(typeof value === 'object' && value !== null ? value : {}),
          };
          this.updateSCIMGroup(id, updateInput);
        } else {
          // parse sub-attribute, possibly array add
          this.applyRemoveOperation(id, path, value);
        }
      } else {
        // For unhandled ops or unknown paths, you may return an error or ignore
        // return res.status(HttpStatus.BAD_REQUEST).json({ detail: `Unsupported op: ${operation}` });
      }
    }

    return this.getSCIMGroup({ id });
  }

  public applyAddOperation(id: string, path: string, value: any) {
    if (path !== 'members' || !Array.isArray(value)) {
      const updateInput: SCIMGroupUpdateInput = {
        [path]: value,
        externalId: '',
        schemas: [],
      };
      this.updateSCIMGroup(id, updateInput);
      return;
    }

    // Fetch group
    const group = this.getSCIMGroupEntity({ id });
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
    console.log('membersUpdate', membersUpdate);

    // Save
    const updateInput: SCIMGroupUpdateInput = {
      [path]: membersUpdate,
    };
    this.updateSCIMGroup(id, updateInput);
  }

  public applyRemoveOperation(id: string, path: string, value: any) {
    if (path !== 'members' || !Array.isArray(value)) {
      const updateInput: SCIMGroupUpdateInput = {
        [path]: value,
        externalId: '',
        schemas: [],
      };
      this.updateSCIMGroup(id, updateInput);
      return;
    }

    // Fetch group
    const group = this.getSCIMGroupEntity({ id });
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
      externalId: '',
      schemas: [],
    };
    this.updateSCIMGroup(id, updateInput);
  }

  public async applyReplaceOperation(id: string, path: string, value: any) {
    if (value === undefined || value === null || value === '') {
      return;
    }
    const updateInput: SCIMGroupUpdateInput = {
      [path]: value,
      externalId: '',
      schemas: [],
    };

    await this.updateSCIMGroup(id, updateInput);
  }

  public getSCIMGroupEntity(options: {
    id?: string;
    displayName?: string;
  }): SCIMGroupEntity | null {
    return this.groupRepository.findOne({ where: { id: options.id } });
  }

  public checkGroupExists(displayName: string): boolean {
    const existingGroup = this.groupRepository.findOne({
      where: { displayName },
    });
    return !!existingGroup; // Return true if group exists, false otherwise
  }
}
