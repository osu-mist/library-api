import { errorBuilder, errorHandler } from 'errors/errors';
import { getBookById, updateBookById } from '../../../db/oracledb/books-dao';
import { serializeBook } from '../../../serializers/books-serializer';

/**
 * Get book by unique ID
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const { id } = req.params;
    const rawBook = await getBookById(id);
    if (!rawBook) {
      errorBuilder(res, 404, 'A book with the specified ID was not found.');
    } else {
      const result = serializeBook(rawBook, req);
      res.send(result);
    }
  } catch (err) {
    errorHandler(res, err);
  }
};

/**
 * Update book by unique ID
 *
 * @type {RequestHandler}
 */
const patch = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the existing book
    const existingBook = await getBookById(id);

    if (!existingBook) {
      errorBuilder(res, 404, 'A book with the specified ID was not found.');
    } else {
      const updateData = req.body.data.attributes;
      const updatedBook = await updateBookById(id, updateData, existingBook);
      const result = serializeBook(updatedBook, req);
      res.send(result);
    }
  } catch (err) {
    errorHandler(res, err);
  }
};

export { get, patch };
