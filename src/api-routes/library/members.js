import { errorHandler } from 'errors/errors';
import { getMembers, postMember } from '../../db/oracledb/members-dao';
import { serializeMember, serializeMembers } from '../../serializers/members-serializer';

/**
 * Get members
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const rawMembers = await getMembers(req.query);
    const result = serializeMembers(rawMembers, req);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

/**
 * Post members
 *
 * @type {RequestHandler}
 */
const post = async (req, res) => {
  try {
    const rawMember = await postMember(req.body);
    const result = serializeMember(rawMember, req);
    res.status(201).send(result);
  } catch (err) {
    errorHandler(res, err);
  }
};

export { get, post };
