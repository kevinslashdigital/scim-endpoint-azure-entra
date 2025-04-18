import { faker } from '@faker-js/faker';

export function createRandomGroup() {
  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    externalId: faker.string.uuid(),
    displayName: faker.internet.username(), // before version 9.1.0, use userName()
    meta: {
      resourceType: 'Group',
    },
  };
}

export const groups = faker.helpers.multiple(createRandomGroup, {
  count: 5,
});
