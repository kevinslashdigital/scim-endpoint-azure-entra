import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppUserService } from './app.user.service';
import { AppGroupService } from './app.group.service';
import { UserRepository } from './user.reposiotry';
import { GroupRepository } from './group.reposiotry';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppUserService, AppGroupService, UserRepository, GroupRepository],
})
export class AppModule {}
