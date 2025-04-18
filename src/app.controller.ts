import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AppUserService } from './app.user.service';
import {
  SCIMUserCreateInput,
  SCIMUserUpdatePartialInput,
  SCIMGroupCreateInput,
  SCIMGroupPatchOperation,
} from './dto/scim.input';

import { SCIMUserCreateOutput } from './dto/scim.output';
import { AppGroupService } from './app.group.service';

@Controller({ path: '/api/scim' })
// @UseGuards(ScimAuthGuard)
// @Internal()
export class AppController {
  appService: any;
  constructor(
    private readonly appUserService: AppUserService,
    private readonly appGroupService: AppGroupService,
    // private readonly logger: LoggerService,
  ) {}

  @Post('Users')
  createUser(@Body() userDto: SCIMUserCreateInput, @Res() res: Response) {
    try {
      const userName = userDto.userName;
      if (!userName) {
        throw new BadRequestException('Missing userName.');
      }
      const user: SCIMUserCreateOutput =
        this.appUserService.createSCIMUser(userDto);
      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        return res.status(409).json({
          detail: `User with userName "${userDto.userName}" already exists.`,
          status: '409',
          scimType: 'uniqueness',
        });
      } else if (error instanceof BadRequestException) {
        return res.status(400).json({
          detail: error.message,
          status: '400',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      }
    }
  }

  @Get('Users/:id')
  getUser(@Param('id') id: string, @Res() res: Response) {
    try {
      const user = this.appUserService.getSCIMUser({
        id,
      });

      return res.status(200).json(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(404).json({
          detail: error.message,
          status: '404',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      }

      return res.status(500).json({ detail: 'Something went wrong.' });
    }
  }

  @Get('Users')
  listUsers(@Res() res: Response, @Query('filter') filter?: string) {
    const users = this.appUserService.listScimUsers(filter);
    res.setHeader('Content-Type', 'application/scim+json');
    return res.status(200).json(users);
  }

  @Delete('Users/:id')
  deleteUser(@Param('id') id: string, @Res() res: Response) {
    try {
      this.appUserService.deleteSCIMUser({ id });
      return res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(404).json({
          detail: error.message,
          status: '404',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      }

      return res.status(500).json({ detail: 'Something went wrong.' });
    }
  }

  @Patch('Users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() userDto: SCIMUserUpdatePartialInput,
    @Res() res: Response,
  ) {
    try {
      const { Operations } = userDto;
      if (!Operations) {
        throw new BadRequestException('PATCH body requires Operations.');
      }

      const user = this.appUserService.applyOperations(id, Operations);

      const scimResponse = {
        ...user,
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      };

      return res.status(200).json(scimResponse);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(404).json({
          detail: error.message,
          status: '404',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      } else if (error instanceof BadRequestException) {
        return res.status(400).json({
          detail: error.message,
          status: '404',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      }

      return res.status(500).json({ detail: 'Something went wrong.' });
    }
  }

  /*
   ****************************************************************************
   *                               SCIM GROUP
   ****************************************************************************
   */
  @Post('Groups')
  createGroup(@Body() groupDto: SCIMGroupCreateInput, @Res() res: Response) {
    try {
      if (!groupDto.displayName) {
        throw new BadRequestException(
          'Missing required attribute: displayName',
        );
      }
      const group = this.appGroupService.createSCIMGroup(groupDto);
      return res.status(201).location(`/Groups/${group.id}`).json(group);
    } catch (error) {
      if (error instanceof ConflictException) {
        return res.status(409).json({
          detail: error.message,
          status: '409',
          scimType: 'uniqueness',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      } else if (error instanceof BadRequestException) {
        return res.status(400).json({
          detail: error.message,
          status: '404',
          scimType: 'invalidValue',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      }
    }
  }

  @Get('Groups/:id')
  getGroup(@Param('id') id: string, @Res() res: Response) {
    try {
      const group = this.appGroupService.getSCIMGroup({
        id,
      });
      return res.status(200).json(group);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(404).json({
          detail: error.message,
          status: '404',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      }
      return res.status(500).json({ detail: 'Something went wrong.' });
    }
  }

  @Get('Groups')
  listGroups(
    @Query('filter') filter?: string,
    @Query('startIndex') startIndex = 1,
    @Query('count') count?: number,
  ) {
    const groups = this.appGroupService.listScimGroups(
      startIndex,
      count,
      filter,
    );
    return groups;
  }

  @Patch('Groups/:id')
  updateGroup(
    @Param('id') id: string,
    @Body()
    body: { schemas: string[]; Operations: SCIMGroupPatchOperation[] },
    @Res() res: Response,
  ) {
    try {
      // const { Operations } = userDto;
      if (!body.Operations) {
        throw new BadRequestException('PATCH body requires Operations.');
      }

      const group = this.appGroupService.applyOperations(id, body.Operations);

      const scimResponse = {
        ...group,
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
      };

      return res.status(200).json(scimResponse);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(404).json({
          detail: error.message,
          status: '404',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      } else if (error instanceof BadRequestException) {
        return res.status(400).json({
          detail: error.message,
          status: '404',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      }
      return res.status(500).json({ detail: 'Something went wrong.' });
    }
  }

  @Delete('Groups/:id')
  deleteGroup(@Param('id') id: string, @Res() res: Response) {
    try {
      this.appGroupService.deleteSCIMGroup(id);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(404).json({
          detail: error.message,
          status: '404',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      }
      return res.status(500).json({ detail: 'Something went wrong.' });
    }
  }
}
