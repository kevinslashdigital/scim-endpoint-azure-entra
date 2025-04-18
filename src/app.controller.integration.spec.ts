import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { SCIMGroupCreateInput, SCIMUserCreateInput } from './dto/scim.input';
import { users } from './faker/user.faker';
import {
  SCIMGroupCreateOutput,
  SCIMGroupList,
  SCIMUserCreateOutput,
  SCIMUserList,
} from './dto/scim.output';
import { App } from 'supertest/types';
import { SCIMUserEntity } from './entity/scim-user.entity';
import { groups } from './faker/group.faker';
import { SCIMGroupEntity } from './entity/scim-group.entity';

describe('SCIM Integration', () => {
  let app: INestApplication;
  const createdUser: SCIMUserCreateOutput[] = [];
  const createdGroup: SCIMGroupCreateOutput[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // if you use global pipes, filters, etc. in main.ts, replicate them here:
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
  describe('SCIM Integration (Users)', () => {
    test.each(users)(
      'POST /Users → 201 + compare with response body',
      async (payload: SCIMUserCreateInput) => {
        const res = await request(app.getHttpServer() as unknown as App)
          .post('/api/scim/Users')
          .send(payload)
          .expect(201);

        expect(res.body).toMatchObject(payload);
        createdUser.push(res.body as SCIMUserCreateOutput);
      },
    );

    it('POST /Users → 409 + Bad Request when creating a duplicate user', async () => {
      const payload: SCIMUserCreateInput = users[0];
      return request(app.getHttpServer() as unknown as App)
        .post('/api/scim/Users')
        .send(payload)
        .expect(409);
    });

    it('Get /Users/:id → 200', async () => {
      return request(app.getHttpServer() as unknown as App)
        .get('/api/scim/Users/' + createdUser[0].id)
        .expect(200)
        .expect((res) => {
          createdUser.push(res.body as SCIMUserCreateOutput);
          expect(res.body).toMatchObject(createdUser[0]);
        });
    });

    it('Get /Users/:id → 404 + Not Found when the user ID is not found', async () => {
      return request(app.getHttpServer() as unknown as App)
        .get('/api/scim/Users/random-id')
        .expect(404);
    });

    it('Get /Users → 200', async () => {
      return request(app.getHttpServer() as unknown as App)
        .get('/api/scim/Users')
        .expect(200)
        .expect((res: { body: SCIMUserList }) => {
          expect(res.body).toBeDefined();
          expect(res.body).toHaveProperty('totalResults');
          expect(res.body).toHaveProperty('Resources');
          expect(res.body.totalResults).toEqual(5);
        })
        .expect('Content-Type', /application\/scim\+json/);
    });

    it('Delete /Users/:id → 204', async () => {
      return request(app.getHttpServer() as unknown as App)
        .delete('/api/scim/Users/' + createdUser[0].id)
        .expect(204);
    });

    it('Delete /Users/:id → 404 Not Found when the user ID is not found.', async () => {
      return request(app.getHttpServer() as unknown as App)
        .delete('/api/scim/Users/random-id')
        .expect(404);
    });

    it('Patch /Users/:id → 200', async () => {
      const payload = {
        Operations: [
          {
            op: 'add',
            path: 'emails[type eq "work"].value',
            value: 'lowell.bergnaum@wolfbahringer.ca',
          },
          {
            op: 'add',
            path: 'emails[type eq "work"].primary',
            value: true,
          },
          {
            op: 'add',
            path: 'addresses[type eq "work"].formatted',
            value: 'XURQHRVEKIIR',
          },
          {
            op: 'add',
            path: 'addresses[type eq "work"].streetAddress',
            value: '7286 Aurelie Grove',
          },
          {
            op: 'add',
            path: 'addresses[type eq "work"].locality',
            value: 'HYUTBATWRTZS',
          },
          {
            op: 'add',
            path: 'addresses[type eq "work"].region',
            value: 'ZCOKSOABRMAY',
          },
          {
            op: 'add',
            path: 'addresses[type eq "work"].postalCode',
            value: 'gk00 9sf',
          },
          {
            op: 'add',
            path: 'addresses[type eq "work"].primary',
            value: true,
          },
          {
            op: 'add',
            path: 'addresses[type eq "work"].country',
            value: 'Luxembourg',
          },
          {
            op: 'add',
            path: 'phoneNumbers[type eq "work"].value',
            value: '1-322-5983',
          },
          {
            op: 'add',
            path: 'phoneNumbers[type eq "work"].primary',
            value: true,
          },
          {
            op: 'add',
            path: 'phoneNumbers[type eq "mobile"].value',
            value: '1-322-5983',
          },
          {
            op: 'add',
            path: 'phoneNumbers[type eq "fax"].value',
            value: '1-322-5983',
          },
          {
            op: 'add',
            path: 'roles[primary eq "True"].display',
            value: 'BLYHDSNKZDDZ',
          },
          {
            op: 'add',
            path: 'roles[primary eq "True"].value',
            value: 'RZCLLLOCXDGR',
          },
          {
            op: 'add',
            path: 'roles[primary eq "True"].type',
            value: 'PKRELXBMLBQU',
          },
          {
            op: 'add',
            value: {
              active: true,
              displayName: 'MEHEIAWVSUUA',
              title: 'BWKSNHWTIIDE',
              preferredLanguage: 'lt-LT',
              name: {
                givenName: 'Lindsay',
                familyName: 'Genevieve',
                formatted: 'Angel',
                middleName: 'Javon',
                honorificPrefix: 'Bud',
                honorificSuffix: 'Enrique',
              },
              nickName: 'BDFWDLTZOIFX',
              locale: 'BZUKXTOLKWWH',
              timezone: 'America/Bahia_Banderas',
              profileUrl: 'JWGJCWQLCPKZ',
            },
          },
        ],
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      };
      const expectedEmails = [
        {
          value: 'lowell.bergnaum@wolfbahringer.ca',
          type: 'work',
          primary: true,
        },
      ];
      const expectedAddresses = [
        {
          formatted: 'XURQHRVEKIIR',
          streetAddress: '7286 Aurelie Grove',
          locality: 'HYUTBATWRTZS',
          region: 'ZCOKSOABRMAY',
          postalCode: 'gk00 9sf',
          country: 'Luxembourg',
          primary: true,
          type: 'work',
        },
      ];

      return request(app.getHttpServer() as unknown as App)
        .patch('/api/scim/Users/' + createdUser[0].id)
        .send(payload)
        .expect((res: { body: SCIMUserEntity }) => {
          expect(res.body.emails).toMatchObject(expectedEmails);
          expect(res.body.addresses).toMatchObject(expectedAddresses);
          expect(res.body).toHaveProperty('profileUrl', 'JWGJCWQLCPKZ');
          expect(res.body).toHaveProperty('locale', 'BZUKXTOLKWWH');
          expect(res.body).toHaveProperty('timezone', 'America/Bahia_Banderas');
        })
        .expect(200);
    });

    it('Patch /Users/:id → 400 + Bad Request when the user ID is not found', async () => {
      const payload = { Operations: [] };
      return request(app.getHttpServer() as unknown as App)
        .patch('/api/scim/Users/random-id')
        .send(payload)
        .expect(404);
    });
  });

  describe('SCIM Integration (Group)', () => {
    test.each(groups)(
      'POST /Groups → 201 + compare with response body',
      async (payload: SCIMGroupCreateInput) => {
        const res = await request(app.getHttpServer() as unknown as App)
          .post('/api/scim/Groups')
          .send(payload)
          .expect(201);

        expect(res.body).toEqual(
          expect.objectContaining({
            displayName: payload.displayName,
            externalId: payload.externalId,
          }),
        );
        createdGroup.push(res.body as SCIMGroupCreateOutput);
      },
    );

    it('POST /Groups → 409 + Bad Request when creating a duplicate group', async () => {
      const payload: SCIMGroupCreateInput = groups[0];
      return request(app.getHttpServer() as unknown as App)
        .post('/api/scim/Groups')
        .send(payload)
        .expect(409);
    });

    it('Get /Groups/:id → 200', async () => {
      return request(app.getHttpServer() as unknown as App)
        .get('/api/scim/Groups/' + createdGroup[0].id)
        .expect(200)
        .expect((res) => {
          createdGroup.push(res.body as SCIMGroupCreateOutput);
          expect(res.body).toMatchObject(createdGroup[0]);
        });
    });

    it('Get /Group/:id → 404 + Not Found when the group ID is not found', async () => {
      return request(app.getHttpServer() as unknown as App)
        .get('/api/scim/Groups/random-id')
        .expect(404);
    });

    it('Get /Groups → 200', async () => {
      return request(app.getHttpServer() as unknown as App)
        .get('/api/scim/Groups')
        .expect(200)
        .expect((res: { body: SCIMGroupList }) => {
          expect(res.body).toBeDefined();
          expect(res.body).toHaveProperty('totalResults');
          expect(res.body).toHaveProperty('Resources');
          expect(res.body.totalResults).toEqual(5);
        });
    });

    it('Delete /Group/:id → 204', async () => {
      return request(app.getHttpServer() as unknown as App)
        .delete('/api/scim/Groups/' + createdGroup[0].id)
        .expect(204);
    });

    it('Delete /Groups/:id → 404 Not Found when the group ID is not found.', async () => {
      return request(app.getHttpServer() as unknown as App)
        .delete('/api/scim/Groups/random-id')
        .expect(404);
    });

    it('Patch /Groups/:id → 200 Add members', async () => {
      const payload = {
        Operations: [
          {
            op: 'add',
            path: 'members',
            value: [
              {
                value: '67f34ea5f4d6a9c18dc541d4',
              },
            ],
          },
        ],
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      };

      return request(app.getHttpServer() as unknown as App)
        .patch('/api/scim/Groups/' + createdGroup[0].id)
        .send(payload)
        .expect((res: { body: SCIMGroupEntity }) => {
          console.log(res.body);
          // expect(res.body.emails).toMatchObject(expectedEmails);
          // expect(res.body.addresses).toMatchObject(expectedAddresses);
          // expect(res.body).toHaveProperty('profileUrl', 'JWGJCWQLCPKZ');
          // expect(res.body).toHaveProperty('locale', 'BZUKXTOLKWWH');
          // expect(res.body).toHaveProperty('timezone', 'America/Bahia_Banderas');
        })
        .expect(200);
    });

    it('Patch /Groups/:id → 200 Remove members', async () => {
      const payload = {
        Operations: [
          {
            op: 'Remove',
            path: 'members',
            value: [
              {
                $ref: null,
                value: '67f34ea5f4d6a9c18dc541d4',
              },
            ],
          },
        ],
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      };

      return request(app.getHttpServer() as unknown as App)
        .patch('/api/scim/Groups/' + createdGroup[0].id)
        .send(payload)
        .expect(200);
    });

    it('Patch /Groups/:id → 200 Replace displayName', async () => {
      const payload = {
        Operations: [
          {
            op: 'Replace',
            path: 'displayName',
            value: 'LMDLead',
          },
        ],
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      };

      return request(app.getHttpServer() as unknown as App)
        .patch('/api/scim/Groups/' + createdGroup[0].id)
        .send(payload)
        .expect((res: { body: SCIMGroupEntity }) => {
          expect(res.body).toHaveProperty('displayName', 'LMDLead');
        })
        .expect(200);
    });

    it('Patch /Groups/:id → 400 + Bad Request when the group ID is not found', async () => {
      const payload = { Operations: [] };
      return request(app.getHttpServer() as unknown as App)
        .patch('/api/scim/Groups/random-id')
        .send(payload)
        .expect(404);
    });
  });
});
