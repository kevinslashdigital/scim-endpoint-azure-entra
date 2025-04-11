import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppUserService } from './app.user.service';
import { UserRepository } from './user.reposiotry';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppUserService, UserRepository],
})
export class AppModule {}
