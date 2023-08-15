import _ from 'lodash';

import oracledb from 'oracledb';

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
      const rawBooksCaps = rows[0];
      const rawBooks = Object.keys(rawBooksCaps).reduce((result, key) => {
        result[key.toLowerCase()] = rawBooksCaps[key];
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
