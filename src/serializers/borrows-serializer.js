import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { paginate } from 'utils/paginator';
import { apiBaseUrl, resourcePathLink, paramsLink } from 'utils/uri-builder';

const borrowResourceProp = openapi.components.schemas.BorrowResource.properties;
const borrowResourceType = borrowResourceProp.type.enum[0];
const borrowResourceAttributes = borrowResourceProp.attributes.allOf;
const borrowCombinedAttributes = _.merge(borrowResourceAttributes[0], borrowResourceAttributes[1]);
const borrowResourceKeysOrg = _.keys(borrowCombinedAttributes.properties);
const borrowResourceKeys = borrowResourceKeysOrg.map((key) => key.toLowerCase());
const borrowResourcePath = 'library/borrows';
const borrowResourceUrl = resourcePathLink(apiBaseUrl, borrowResourcePath);

/**
 * Serialize borrowResources to JSON API
 *
 * @param {object[]} rawBorrows Raw data rows from data source
 * @param {object} req Express request object
 * @returns {object} Serialized borrowResources object
 */
const serializeBorrows = (rawBorrows, req) => {
  const { query } = req;

  // Add pagination links and meta information to options if pagination is enabled
  const pageQuery = {
    size: query['page[size]'],
    number: query['page[number]'],
  };

  const pagination = paginate(rawBorrows, pageQuery);
  pagination.totalResults = rawBorrows.length;

  // TODO use req.path
  const topLevelSelfLink = paramsLink(borrowResourceUrl, query);
  const serializerArgs = {
    identifierField: 'borrow_id',
    resourceKeys: borrowResourceKeys,
    pagination,
    resourcePath: borrowResourcePath,
    topLevelSelfLink,
    query,
    enableDataLinks: true,
  };

  return new JsonApiSerializer(
    borrowResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawBorrows);
};

/**
 * Serialize borrowResource to JSON API
 *
 * @param {object} rawBorrow Raw data row from data source
 * @param {boolean} req Express request object
 * @returns {object} Serialized borrowResource object
 */
const serializeBorrow = (rawBorrow, req) => {
  const { query } = req;

  // TODO use req.path
  const baseUrl = req.method === 'POST'
    ? borrowResourceUrl
    : resourcePathLink(borrowResourceUrl, rawBorrow.borrow_id);
  const topLevelSelfLink = paramsLink(baseUrl, query);

  const serializerArgs = {
    identifierField: 'borrow_id',
    resourceKeys: borrowResourceKeys,
    resourcePath: borrowResourcePath,
    topLevelSelfLink,
    query,
    enableDataLinks: true,
  };

  return new JsonApiSerializer(
    borrowResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawBorrow);
};
export { serializeBorrows, serializeBorrow };
