import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { paginate } from 'utils/paginator';
import { apiBaseUrl, resourcePathLink, paramsLink } from 'utils/uri-builder';

const bookResourceProp = openapi.components.schemas.BookResource.properties;
const bookResourceType = bookResourceProp.type.enum[0];
const bookResourceAttributes = bookResourceProp.attributes.allOf;
const bookCombinedAttributes = _.merge(bookResourceAttributes[0], bookResourceAttributes[1]);
const bookResourceKeys = _.keys(bookCombinedAttributes.properties);
const bookResourcePath = 'books';
const bookResourceUrl = resourcePathLink(apiBaseUrl, bookResourcePath);

/**
 * Serialize bookResources to JSON API
 *
 * @param {object[]} rawBooks Raw data rows from data source
 * @param {object} req Express request object
 * @returns {object} Serialized bookResources object
 */
const serializeBooks = (rawBooks, req) => {
  const { query } = req;

  // Add pagination links and meta information to options if pagination is enabled
  const pageQuery = {
    size: query['page[size]'],
    number: query['page[number]'],
  };

  const pagination = paginate(rawBooks, pageQuery);
  pagination.totalResults = rawBooks.length;
  rawBooks = pagination.paginatedRows;

  // TODO use req.path
  const topLevelSelfLink = paramsLink(bookResourceUrl, query);
  const serializerArgs = {
    identifierField: 'id',
    resourceKeys: bookResourceKeys,
    pagination,
    resourcePath: bookResourcePath,
    topLevelSelfLink,
    query,
    enableDataLinks: true,
  };

  return new JsonApiSerializer(
    bookResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawBooks);
};

/**
 * Serialize bookResource to JSON API
 *
 * @param {object} rawBook Raw data row from data source
 * @param {boolean} req Express request object
 * @returns {object} Serialized bookResource object
 */
const serializeBook = (rawBook, req) => {
  const { query } = req;

  // TODO use req.path
  const baseUrl = req.method === 'POST'
    ? bookResourceUrl
    : resourcePathLink(bookResourceUrl, rawBook.book_id);
  const topLevelSelfLink = paramsLink(baseUrl, query);

  const serializerArgs = {
    identifierField: 'book_id',
    resourceKeys: bookResourceKeys,
    resourcePath: bookResourcePath,
    topLevelSelfLink,
    query,
    enableDataLinks: true,
  };

  return new JsonApiSerializer(
    bookResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawBook);
  
};
export { serializeBooks, serializeBook };
