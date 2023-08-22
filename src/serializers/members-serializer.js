import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { paginate } from 'utils/paginator';
import { apiBaseUrl, resourcePathLink, paramsLink } from 'utils/uri-builder';

const memberResourceProp = openapi.components.schemas.MemberResource.properties;
const memberResourceType = memberResourceProp.type.enum[0];
const memberResourceAttributes = memberResourceProp.attributes.allOf;
const memberCombinedAttributes = _.merge(memberResourceAttributes[0], memberResourceAttributes[1]);
const memberResourceKeysOrg = _.keys(memberCombinedAttributes.properties);
const memberResourceKeys = memberResourceKeysOrg.map((key) => key.toLowerCase());
const memberResourcePath = 'library/members';
const memberResourceUrl = resourcePathLink(apiBaseUrl, memberResourcePath);

/**
 * Serialize memberResources to JSON API
 *
 * @param {object[]} rawMembers Raw data rows from data source
 * @param {object} req Express request object
 * @returns {object} Serialized memberResources object
 */
const serializeMembers = (rawMembers, req) => {
  const { query } = req;

  // Add pagination links and meta information to options if pagination is enabled
  const pageQuery = {
    size: query['page[size]'],
    number: query['page[number]'],
  };

  const pagination = paginate(rawMembers, pageQuery);
  pagination.totalResults = rawMembers.length;

  // TODO use req.path
  const topLevelSelfLink = paramsLink(memberResourceUrl, query);
  const serializerArgs = {
    identifierField: 'member_id',
    resourceKeys: memberResourceKeys,
    pagination,
    resourcePath: memberResourcePath,
    topLevelSelfLink,
    query,
    enableDataLinks: true,
  };

  return new JsonApiSerializer(
    memberResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawMembers);
};

/**
 * Serialize memberResource to JSON API
 *
 * @param {object} rawMember Raw data row from data source
 * @param {boolean} req Express request object
 * @returns {object} Serialized memberResource object
 */
const serializeMember = (rawMember, req) => {
  const { query } = req;

  // TODO use req.path
  const baseUrl = req.method === 'POST'
    ? memberResourceUrl
    : resourcePathLink(memberResourceUrl, rawMember.member_id);
  const topLevelSelfLink = paramsLink(baseUrl, query);

  const serializerArgs = {
    identifierField: 'member_id',
    resourceKeys: memberResourceKeys,
    resourcePath: memberResourcePath,
    topLevelSelfLink,
    query,
    enableDataLinks: true,
  };

  return new JsonApiSerializer(
    memberResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawMember);
};
export { serializeMembers, serializeMember };
