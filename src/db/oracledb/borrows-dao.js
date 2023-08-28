import _ from 'lodash';
import oracledb from 'oracledb';

import { parseQuery } from 'utils/parse-query';
import { generateWhereClause, generatePaginationParams, convertKeysToLowercase } from 'utils/dao-helper';

import { getConnection } from './connection';

/**
 * Return a list of borrows with pagination
 *
 * @param {object} query Query parameters
 * @returns {Promise<object>[]} Promise object represents a list of borrows
 */
const getBorrows = async (query) => {
  const connection = await getConnection();
  try {
    const parsedQuery = parseQuery(query);
    const whereClause = generateWhereClause(parsedQuery).toLowerCase();
    const paginationParams = generatePaginationParams(parsedQuery);

    const selectQuery = `
      SELECT *
      FROM library_api_borrows
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
 * Return a specific borrow by unique ID
 *
 * @param {string} id Unique borrow ID
 * @returns {Promise<object>} Promise object represents a specific borrow or return undefined
 *                            if term is not found
 */
const getBorrowById = async (id) => {
  const connection = await getConnection();
  const query = `
    SELECT *
    FROM library_api_borrows
    WHERE borrow_id = :borrowId
  `;

  try {
    const bindVars = { borrowId: id };

    const { rows } = await connection.execute(query, bindVars);
    if (_.isEmpty(rows)) {
      return undefined;
    }
    if (rows.length > 1) {
      throw new Error('Expect a single object but got multiple results.');
    } else {
      const rawBorrowsLower = rows[0];
      return convertKeysToLowercase([rawBorrowsLower])[0];
    }
  } finally {
    connection.close();
  }
};

/**
 * Update a specific borrow by unique ID
 *
 * @param {string} id Unique borrow ID
 * @param {object} updateData Data to update
 * @param {object} existingBorrow Existing borrow to update
 * @returns {Promise<object>} Promise object represents the updated borrow or undefined if not found
 */
const updateBorrowById = async (id, updateData, existingBorrow) => {
  const connection = await getConnection();

  try {
    const lowercaseUpdateData = convertKeysToLowercase([updateData])[0];
    const updatedBorrowData = {
      ...existingBorrow,
      ...lowercaseUpdateData,
    };

    const updateQueryKeys = Object.keys(updatedBorrowData).filter((key) => key !== 'borrow_id');
    const updateQuerySet = updateQueryKeys.map((key) => `${key} = :${key}`).join(', ');

    const updateQuery = `
      UPDATE library_api_borrows
      SET ${updateQuerySet}
      WHERE borrow_id = :borrowId
    `;

    const bindVars = {
      borrowId: id,
    };

    updateQueryKeys.forEach((key) => {
      bindVars[key] = key === 'publicationyear' ? updatedBorrowData[key] : updatedBorrowData[key].toLowerCase();
    });

    const result = await connection.execute(updateQuery, bindVars);

    if (result.rowsAffected === 1) {
      await connection.commit();
      connection.close();
      return getBorrowById(id);
    }
    await connection.rollback();
    throw new Error(`Failed to update the borrow. Error: ${result.errorNum}`);
  } finally {
    connection.close();
  }
};

/**
 * Posts a new borrow to the Oracle database
 *
 * Inserts the posted borrow into the Oracle database.
 *
 * @param {object} body Request body
 * @returns {Promise<object>} Promise object represents the posted borrow
 */
const postBorrow = async (body) => {
  const connection = await getConnection();

  try {
    const newBorrowDataRaw = body.data.attributes;
    const newBorrowData = {
      title: newBorrowDataRaw.title.toLowerCase(),
      author: newBorrowDataRaw.author.toLowerCase(),
      publicationyear: newBorrowDataRaw.publicationYear,
      isbn: newBorrowDataRaw.isbn.toLowerCase(),
      genre: newBorrowDataRaw.genre.toLowerCase(),
      description: newBorrowDataRaw.description.toLowerCase(),
      available: 'true',
    };

    const insertQuery = `
      INSERT INTO library_api_borrows (
        borrow_id,
        title,
        author,
        publicationyear,
        isbn,
        genre,
        description,
        available
      ) VALUES (
        library_api_borrows_seq.NEXTVAL, -- Use the sequence here
        :title,
        :author,
        :publicationYear,
        :isbn,
        :genre,
        :description,
        :available
      )
      RETURNING borrow_id INTO :insertedId
    `; // Fetch the inserted ID

    const bindVars = {
      ...newBorrowData,
      insertedId: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
    };

    const result = await connection.execute(insertQuery, bindVars);

    if (result.rowsAffected === 1) {
      await connection.commit();
      newBorrowData.borrow_id = result.outBinds.insertedId;
      return newBorrowData;
    }
    await connection.rollback();
    throw new Error(`Failed to insert the borrow. Error: ${result.errorNum}`);
  } finally {
    connection.close();
  }
};

export {
  getBorrows,
  getBorrowById,
  updateBorrowById,
  postBorrow,
};
