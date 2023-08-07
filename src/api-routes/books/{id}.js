import { errorBuilder, errorHandler } from 'errors/errors';
import { getBookById } from '../../db/json/books-dao-example';
import { serializeBook } from '../../serializers/books-serializer';

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

export { get };
