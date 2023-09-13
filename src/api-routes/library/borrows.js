import { errorHandler } from 'errors/errors';
import { getBorrows, postBorrow } from '../../db/oracledb/borrows-dao';
import { serializeBorrow, serializeBorrows } from '../../serializers/borrows-serializer';

/**
 * Get borrows
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const rawBorrows = await getBorrows(req.query);
    const result = serializeBorrows(rawBorrows, req);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

/**
 * Post borrows
 *
 * @type {RequestHandler}
 */
const post = async (req, res) => {
  try {
    const rawBorrow = await postBorrow(req.body);
    const result = serializeBorrow(rawBorrow, req);
    res.status(201).send(result);
  } catch (err) {
    errorHandler(res, err);
  }
};

export { get, post };
