import _ from 'lodash';
import { Resource } from '@prisma/client';
import { ResourceListItem } from '@refly/schema';

export const convertResourcePoToListItem = (resource: Resource): ResourceListItem => {
  return _.omit(resource, ['id', 'userId', 'deletedAt']);
};
