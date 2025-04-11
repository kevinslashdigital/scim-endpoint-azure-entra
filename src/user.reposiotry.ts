import { Injectable, NotFoundException } from '@nestjs/common';
import { SCIMUserEntity } from './entity/scim-user.entity';

@Injectable()
export class UserRepository {
  private users: SCIMUserEntity[] = [];
  public save(user: SCIMUserEntity): SCIMUserEntity {
    this.users.push(user);
    return user;
  }

  public findOne(option: any): SCIMUserEntity {
    const user: SCIMUserEntity = this.users.find(
      (user) => user.userName === option.where.userName,
    );
    if (!user) {
      throw new NotFoundException(`User with userName ${userName} not found`);
    }
    return user;
  }
}
