import _ from 'lodash';

import oracledb from 'oracledb';

import { parseQuery } from 'utils/parse-query';

import { getConnection } from './connection';

/**
 * Generates a WHERE clause based on parsed filter parameters.
 *
 * @param {object} parsedFilters Parsed filter parameters.
 * @returns {string} The WHERE clause string for SQL queries.
 */
const generateWhereClause = (parsedFilters) => {
  const conditions = Object.keys(parsedFilters).map((key) => {
    const filter = parsedFilters[key];

    // Check if the filter is a simple string condition
    // such as: 'key = publicationyear, string filter = 1990'
    if (typeof filter === 'string') {
      return `${key} = '${filter}'`;
    } else if (typeof filter === 'object') {
      // If the filter is an object, extract operator and value
      // such as: 'key = author, SQL operator = LIKE, Value = Paulo'
      const { operator, value } = filter;

      // Handle the LIKE operator for text searching with %
      if (operator === 'LIKE') {
        return `${key} ${operator} '%${value}%'`;
      } else {
        // For other supported operators from operatorSymbols, create the condition
        return `${key} ${operator} '${value}'`;
      }
    }
    // Return an empty string for unsupported conditions
    return '';
  });

  // Filter out empty conditions and join them with 'AND'
  const filteredConditions = conditions.filter(Boolean);
  if (filteredConditions.length > 0) {
    return `WHERE ${filteredConditions.join(' AND ')}`;
  }
  return ''; // Return an empty string if no conditions are provided
};

/**
 * Return a list of books with pagination
 *
 * @param {object} query Query parameters
 * @returns {Promise<object>[]} Promise object represents a list of books
 */
const getBooks = async (query) => {
  const connection = await getConnection();
  try {
    const parsedQuery = parseQuery(query);
    const whereClause = generateWhereClause(parsedQuery).toLowerCase();

    const pageNumber = parseInt(parsedQuery['page[number]'], 10) || 1;
    const perPage = parseInt(parsedQuery['page[size]'], 10) || 25;
    const offset = (pageNumber - 1) * perPage;

    const selectQuery = `
      SELECT *
      FROM library_api_books
      ${whereClause}
      OFFSET ${offset} ROWS FETCH NEXT ${perPage} ROWS ONLY
    `;

    const response = await connection.execute(selectQuery);
    const { rows } = response;
    const rowsLower = rows.map((item) => {
      const newItem = {};
      Object.keys(item).forEach((key) => {
        newItem[key.toLowerCase()] = item[key];
      });
      return newItem;
    });
    return rowsLower;
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
  const query = `
    SELECT *
    FROM library_api_books
    WHERE book_id = :bookId
  `;

  try {
    const bindVars = { bookId: id };

    const { rows } = await connection.execute(query, bindVars);
    if (_.isEmpty(rows)) {
      return undefined;
    }
    if (rows.length > 1) {
      throw new Error('Expect a single object but got multiple results.');
    } else {
      const rawBooksLower = rows[0];
      const rawBooks = Object.keys(rawBooksLower).reduce((result, key) => {
        result[key.toLowerCase()] = rawBooksLower[key];
        return result;
      }, {});
      return rawBooks;
    }
  } finally {
    connection.close();
  }
};

/**
 * Update a specific book by unique ID
 *
 * @param {string} id Unique book ID
 * @param {object} updateData Data to update
 * @param {object} existingBook Exisitng book to update
 * @returns {Promise<object>} Promise object represents the updated book or undefined if not found
 */
const updateBookById = async (id, updateData, existingBook) => {
  const connection = await getConnection();

  try {
    const updatedBookData = {
      ...existingBook,
      ...updateData,
    };

    const updateQuery = `
      UPDATE library_api_books
      SET title = :title,
          author = :author,
          publicationyear = :publicationYear,
          isbn = :isbn,
          genre = :genre,
          description = :description,
          available = :available
      WHERE book_id = :bookId
    `;

    const bindVars = {
      title: updatedBookData.title,
      author: updatedBookData.author,
      publicationYear: updatedBookData.publicationyear,
      isbn: updatedBookData.isbn,
      genre: updatedBookData.genre,
      description: updatedBookData.description,
      available: updatedBookData.available,
      bookId: id,
    };

    const result = await connection.execute(updateQuery, bindVars);

    if (result.rowsAffected === 1) {
      await connection.commit();
      connection.close();
      return getBookById(id);
    }
    await connection.rollback();
    throw new Error(`Failed to update the book. Error: ${result.errorNum}`);
  } finally {
    connection.close();
  }
};

/**
 * Posts a new book to the Oracle database
 *
 * Inserts the posted book into the Oracle database.
 *
 * @param {object} body Request body
 * @returns {Promise<object>} Promise object represents the posted book
 */
const postBook = async (body) => {
  const connection = await getConnection();

  try {
    const newBookData = body.data.attributes;
    newBookData.available = 'true';

    const insertQuery = `
      INSERT INTO library_api_books (
        book_id,
        title,
        author,
        publicationyear,
        isbn,
        genre,
        description,
        available
      ) VALUES (
        library_api_books_seq.NEXTVAL, -- Use the sequence here
        :title,
        :author,
        :publicationYear,
        :isbn,
        :genre,
        :description,
        :available
      )
      RETURNING book_id INTO :insertedId
    `; // Fetch the inserted ID

    const bindVars = {
      title: newBookData.title,
      author: newBookData.author,
      publicationYear: newBookData.publicationYear,
      isbn: newBookData.isbn,
      genre: newBookData.genre,
      description: newBookData.description,
      available: newBookData.available,
      insertedId: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
    };

    const result = await connection.execute(insertQuery, bindVars);

    if (result.rowsAffected === 1) {
      await connection.commit();
      newBookData.book_id = result.outBinds.insertedId;

      return newBookData;
    }
    await connection.rollback();
    throw new Error(`Failed to insert the book. Error: ${result.errorNum}`);
  } finally {
    connection.close();
  }
};

export {
  getBooks,
  getBookById,
  updateBookById,
  postBook,
};
