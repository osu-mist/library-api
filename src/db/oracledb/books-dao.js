import _ from 'lodash';

import { parseQuery } from 'utils/parse-query';

import { getConnection } from './connection';

/**
 * Return a list of books
 *
 * @param {object} query Query parameters
 * @returns {Promise<object>[]} Promise object represents a list of books
 */
const getBooks = async (query) => {
  const connection = await getConnection();
  try {
    const parsedQuery = parseQuery(query); // contrib is changed
    const { rawBooks } = await connection.execute(parsedQuery);
    return rawBooks;
  } finally {
    connection.close();
  }
};

/**
 * Return a specific book by unique ID
 *
 * @param {string} id Unique book ID
 * @returns {Promise<object>} Promise object represents a specific book or return undefined if term
 *                            is not found
 */
const getBookById = async (id) => {
  const connection = await getConnection();
  const query = 'SELECT * from library_api_books where book_id = :bookId';
  try {
    const { rows } = await connection.execute(query, { bookId: id });
    const rawBooks = rows;
    if (_.isEmpty(rawBooks)) {
      return undefined;
    }
    if (rawBooks.length > 1) {
      throw new Error('Expect a single object but got multiple results.');
    } else {
      const [rawBook] = rawBooks;
      return rawBook;
    }
  } finally {
    connection.close();
  }
};

export { getBooks, getBookById };
