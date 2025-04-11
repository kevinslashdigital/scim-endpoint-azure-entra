import { Injectable, NotFoundException } from '@nestjs/common';
import { SCIMUserEntity } from './entity/scim-user.entity';

interface FindOneOption {
  where: {
    userName: string;
  };
}

@Injectable()
export class UserRepository {
  private users: SCIMUserEntity[] = [];
  public save(user: SCIMUserEntity): SCIMUserEntity {
    this.users.push(user);
    return user;
  }

  public findOne(option: FindOneOption): SCIMUserEntity {
    const { userName } = option.where;
    const user = this.users.find((user) => user.userName === userName);
    if (!user) {
      throw new NotFoundException(`User with userName ${userName} not found`);
    }
    return user;
  }
}
