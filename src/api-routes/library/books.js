import { errorHandler } from 'errors/errors';
import { getBooks, postBook } from '../../db/oracledb/books-dao';
import { serializeBook, serializeBooks } from '../../serializers/books-serializer';

/**
 * Get books
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const rawBooks = await getBooks(req.query);
    const result = serializeBooks(rawBooks, req);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

/**
 * Post books
 *
 * @type {RequestHandler}
 */
const post = async (req, res) => {
  try {
    const rawBook = await postBook(req.body);
    const result = serializeBook(rawBook, req);
    res.status(201).send(result);
  } catch (err) {
    errorHandler(res, err);
  }
};

export { get, post };
