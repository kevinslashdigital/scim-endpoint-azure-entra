import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppUserService } from './app.user.service';
import { SCIMUserCreateInput } from './dto/scim.input';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppUserService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', async () => {
      const mockUser: SCIMUserCreateInput = {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        externalId: '456',
        userName: 'testuser',
        name: {
          givenName: 'Test',
          familyName: 'User',
        },
        active: true,
        emails: [{ value: 'testuser@example.com' }],
        displayName: 'Test User',
        resourceType: 'User',
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
        sendStatus: jest.fn(),
        end: jest.fn(),
        headersSent: false,
        locals: {},
      } as unknown as import('express').Response;
      const result = await appController.createUser(mockUser, mockResponse);
      console.log(result);
      // expect(result.).toHaveBeenCalledWith(201);
      // expect(mockResponse.json).toHaveBeenCalledWith(expect.any(Object));
    });
  });
});
