import _ from 'lodash';

import { parseQuery } from 'utils/parse-query';
import { getConnection, validateOracleDb } from './connection';

import { convertOutBindsToRawResource, getBindParams, outBindParamToPropertyName } from 'utils/bind-params';
import { GetFilterProcessor } from 'utils/process-get-filters';

/**
 * Return a list of books
 *
 * @param {object} query Query parameters
 * @returns {Promise<object>[]} Promise object represents a list of books
 */
const getBooks = async (query) => {
  const connection = await getConnection();
  try {
    const parsedQuery = parseQuery(query);
    const { rawBooks } = await connection.execute("SELECT * from library_api_books");
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
  console.log(id);
  const connection = await getConnection();
  const qu = "SELECT * from library_api_books where book_id = :bookId";
  try {
    const  {rows}  = await connection.execute(qu, { bookId: id });
    const rawBooks = rows;

    if (_.isEmpty(rawBooks)) {
      console.log(rawBooks);
      return undefined;
    }
    if (rawBooks.length > 1) {
      console.log(rawBooks);
      throw new Error('Expect a single object but got multiple results.');
    } else {
      console.log(rawBooks);
      const [rawBook] = rawBooks;
      return rawBook;
    }
  } finally {
    connection.close();
  }
};

export { getBooks, getBookById };
