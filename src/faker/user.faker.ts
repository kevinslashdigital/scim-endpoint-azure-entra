import { faker } from '@faker-js/faker';

export function createRandomUser() {
  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    externalId: faker.string.uuid(),
    userName: faker.internet.username(), // before version 9.1.0, use userName()
    active: true,
    emails: [
      {
        primary: faker.datatype.boolean(),
        type: 'work',
        value: faker.internet.email(),
      },
    ],
    name: {
      formatted: faker.person.fullName(),
      familyName: faker.person.lastName(),
      givenName: faker.person.firstName(),
    },
    meta: {
      resourceType: 'User',
    },
    roles: [],
  };
}

export const users = faker.helpers.multiple(createRandomUser, {
  count: 5,
});
