import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  LoggerService,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AppUserService } from './app.user.service';
import {
  SCIMUserCreateInput,
  // SCIMGroupCreateInput,
  // SCIMGroupPatchOperation,
} from './dto/scim.input';

import {
  // SCIMGroupCreateOutput,
  SCIMUserCreateOutput,
} from './dto/scim.output';

@Controller({ path: '/api/scim' })
// @UseGuards(ScimAuthGuard)
// @Internal()
export class AppController {
  constructor(
    private readonly appUserService: AppUserService,
    private readonly logger: LoggerService,
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
          status: '404',
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        });
      }
    }
  }

  // @Get('Users/:id')
  // async getUser(@Param('id') id: string, @Res() res: Response) {
  //   try {
  //     const user = await this.appService.getSCIMUser({
  //       id,
  //     });

  //     return res.status(200).json(user);
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       return res.status(404).json({
  //         detail: error.message,
  //         status: '404',
  //         schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
  //       });
  //     }

  //     return res.status(500).json({ detail: 'Something went wrong.' });
  //   }
  // }

  // @Get('Users')
  // async listUsers(@Res() res: Response, @Query('filter') filter?: any) {
  //   const users: any[] = await this.appService.listScimUsers(filter);
  //   res.setHeader('Content-Type', 'application/scim+json');
  //   return res.status(200).json(users);
  // }

  // @Patch('Users/:id')
  // async partialUpdateUser(
  //   @Param('id') id: string,
  //   @Body() userDto: SCIMUserUpdatePartialInput,
  //   @Res() res: Response,
  // ) {
  //   try {
  //     const { Operations } = userDto;
  //     if (!Operations) {
  //       throw new BadRequestException('PATCH body requires Operations.');
  //     }

  //     const user = await this.appService.applyOperations(id, Operations);

  //     const scimResponse = {
  //       ...user,
  //       schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
  //     };

  //     return res.status(200).json(scimResponse);
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       return res.status(404).json({
  //         detail: error.message,
  //         status: '404',
  //         schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
  //       });
  //     } else if (error instanceof BadRequestException) {
  //       return res.status(400).json({
  //         detail: error.message,
  //         status: '404',
  //         schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
  //       });
  //     }

  //     return res.status(500).json({ detail: 'Something went wrong.' });
  //   }
  // }

  // @Delete('Users/:id')
  // async deleteUser(@Param('id') id: string, @Res() res: Response) {
  //   try {
  //     await this.appService.deleteSCIMUser({ id });
  //     return res.status(204).send();
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       return res.status(404).json({
  //         detail: error.message,
  //         status: '404',
  //         schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
  //       });
  //     }

  //     return res.status(500).json({ detail: 'Something went wrong.' });
  //   }
  // }

  /*
   ****************************************************************************
   *                               SCIM GROUP
   ****************************************************************************
   */
  // @Post('Groups')
  // async createGroup(
  //   @Body() groupDto: SCIMGroupCreateInput,
  //   @Res() res: Response,
  // ) {
  //   try {
  //     if (!groupDto.displayName) {
  //       throw new BadRequestException(
  //         'Missing required attribute: displayName',
  //       );
  //     }
  //     const group = (await this.appService.createSCIMGroup(
  //       groupDto,
  //     )) as SCIMGroupCreateOutput;
  //     return res.status(201).location(`/Groups/${group.id}`).json(group);
  //   } catch (error) {
  //     if (error instanceof ConflictException) {
  //       return res.status(409).json({
  //         detail: error.message,
  //         status: '409',
  //         scimType: 'uniqueness',
  //         schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
  //       });
  //     } else if (error instanceof BadRequestException) {
  //       return res.status(400).json({
  //         detail: error.message,
  //         status: '404',
  //         scimType: 'invalidValue',
  //         schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
  //       });
  //     }
  //   }
  // }

  // @Get('Groups/:id')
  // async getGroup(@Param('id') id: string, @Res() res: Response) {
  //   try {
  //     const group = await this.appService.getSCIMGroup({
  //       id,
  //     });
  //     return res.status(200).json(group);
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       return res.status(404).json({
  //         detail: error.message,
  //         status: '404',
  //         schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
  //       });
  //     }
  //     return res.status(500).json({ detail: 'Something went wrong.' });
  //   }
  // }

  // @Get('Groups')
  // async listGroups(
  //   @Query('filter') filter?: string,
  //   @Query('startIndex') startIndex = 1,
  //   @Query('count') count?: number,
  // ) {
  //   const groups = await this.appService.listScimGroups(
  //     filter,
  //     startIndex,
  //     count,
  //   );
  //   return groups;
  // }

  // @Patch('Groups/:id')
  // async updateGroup(
  //   @Param('id') id: string,
  //   @Body()
  //   body: { schemas: string[]; Operations: SCIMGroupPatchOperation[] },
  //   @Res() res: Response,
  // ) {
  //   this.logger.debug(
  //     `Received PATCH request for group ${id} with body: ${JSON.stringify(
  //       body,
  //     )}`,
  //   );
  //   try {
  //     // const { Operations } = userDto;
  //     if (!body.Operations) {
  //       throw new BadRequestException('PATCH body requires Operations.');
  //     }

  //     const group = await this.appService.applyOperations(
  //       id,
  //       workspaceId,
  //       body.Operations,
  //     );

  //     const scimResponse = {
  //       ...group,
  //       schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
  //     };

  //     return res.status(200).json(scimResponse);
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       return res.status(404).json({
  //         detail: error.message,
  //         status: '404',
  //         schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
  //       });
  //     } else if (error instanceof BadRequestException) {
  //       return res.status(400).json({
  //         detail: error.message,
  //         status: '404',
  //         schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
  //       });
  //     }
  //     this.logger.error(
  //       `Failed to PATCH group ${id} - ${JSON.stringify(body)}: ${
  //         error.message
  //       }`,
  //     );

  //     return res.status(500).json({ detail: 'Something went wrong.' });
  //   }
  // }

  // @Delete('Groups/:id')
  // async deleteGroup(@Param('id') id: string, @Res() res: Response) {
  //   try {
  //     await this.appService.deleteSCIMGroup(id);
  //     return res.status(204).send();
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       return res.status(404).json({
  //         detail: error.message,
  //         status: '404',
  //         schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
  //       });
  //     }
  //     return res.status(500).json({ detail: 'Something went wrong.' });
  //   }
  // }
}
