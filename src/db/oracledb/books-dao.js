import _ from 'lodash';
import oracledb from 'oracledb';

import { parseQuery } from 'utils/parse-query';
import { generateWhereClause, generatePaginationParams, convertKeysToLowercase } from 'utils/dao-helper';

import { getConnection } from './connection';

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
    const paginationParams = generatePaginationParams(parsedQuery);

    const selectQuery = `
      SELECT *
      FROM library_api_books
      ${whereClause}
      OFFSET ${paginationParams.offset} ROWS FETCH NEXT ${paginationParams.perPage} ROWS ONLY
    `;

    const { rows } = await connection.execute(selectQuery);
    return convertKeysToLowercase(rows);
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
      return convertKeysToLowercase([rawBooksLower])[0];
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
      title: updatedBookData.title.toLowerCase(),
      author: updatedBookData.author.toLowerCase(),
      publicationYear: updatedBookData.publicationYear,
      isbn: updatedBookData.isbn.toLowerCase(),
      genre: updatedBookData.genre.toLowerCase(),
      description: updatedBookData.description.toLowerCase(),
      available: updatedBookData.available.toLowerCase(),
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
    const newBookDataRaw = body.data.attributes;
    const newBookData = {
      title: newBookDataRaw.title.toLowerCase(),
      author: newBookDataRaw.author.toLowerCase(),
      publicationyear: newBookDataRaw.publicationYear,
      isbn: newBookDataRaw.isbn.toLowerCase(),
      genre: newBookDataRaw.genre.toLowerCase(),
      description: newBookDataRaw.description.toLowerCase(),
      available: 'true',
    };

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
      ...newBookData,
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
