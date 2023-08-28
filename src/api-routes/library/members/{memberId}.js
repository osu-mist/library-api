import { errorBuilder, errorHandler } from 'errors/errors';
import { getMemberById, updateMemberById } from '../../../db/oracledb/members-dao';
import { serializeMember } from '../../../serializers/members-serializer';

/**
 * Get member by unique ID
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const { memberId } = req.params;
    const rawMember = await getMemberById(memberId);
    if (!rawMember) {
      errorBuilder(res, 404, 'A member with the specified ID was not found.');
    } else {
      const result = serializeMember(rawMember, req);
      res.send(result);
    }
  } catch (err) {
    errorHandler(res, err);
  }
};

/**
 * Update member by unique ID
 *
 * @type {RequestHandler}
 */
const patch = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Fetch the existing member
    const existingMember = await getMemberById(memberId);

    if (!existingMember) {
      errorBuilder(res, 404, 'A member with the specified ID was not found.');
    } else {
      const updateData = req.body.data.attributes;
      const updatedMember = await updateMemberById(memberId, updateData, existingMember);

      const result = serializeMember(updatedMember, req);
      res.send(result);
    }
  } catch (err) {
    errorHandler(res, err);
  }
};

export { get, patch };
