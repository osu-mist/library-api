import { errorBuilder, errorHandler } from 'errors/errors';
import { getBorrowById, updateBorrowById } from '../../../db/oracledb/borrows-dao';
import { serializeBorrow } from '../../../serializers/borrows-serializer';

/**
 * Get borrow by unique ID
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const { borrowId } = req.params;
    const rawBorrow = await getBorrowById(borrowId);
    if (!rawBorrow) {
      errorBuilder(res, 404, 'A borrow with the specified ID was not found.');
    } else {
      const result = serializeBorrow(rawBorrow, req);
      res.send(result);
    }
  } catch (err) {
    errorHandler(res, err);
  }
};

/**
 * Update borrow by unique ID
 *
 * @type {RequestHandler}
 */
const patch = async (req, res) => {
  try {
    const { borrowId } = req.params;

    // Fetch the existing borrow
    const existingBorrow = await getBorrowById(borrowId);

    if (!existingBorrow) {
      errorBuilder(res, 404, 'A borrow with the specified ID was not found.');
    } else {
      const updateData = req.body.data.attributes;
      const updatedBorrow = await updateBorrowById(borrowId, updateData, existingBorrow);

      const result = serializeBorrow(updatedBorrow, req);
      res.send(result);
    }
  } catch (err) {
    errorHandler(res, err);
  }
};

export { get, patch };
