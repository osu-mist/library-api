import _ from 'lodash';
import oracledb from 'oracledb';

import { parseQuery } from 'utils/parse-query';
import {
  generateWhereClause,
  generatePaginationParams,
  formatDateInWhereClause,
  convertDatesInObject,
  convertToSnakeCase,
  convertArrayToSnakeCase,
  convertKeysToCamelCase,
  removeNullKeys,
} from 'utils/dao-helper';

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
    const snakeCaseParsedQuery = convertToSnakeCase(parsedQuery);
    const originalWhereClause = generateWhereClause(snakeCaseParsedQuery).toLowerCase();
    const whereClause = formatDateInWhereClause(originalWhereClause);
    const paginationParams = generatePaginationParams(snakeCaseParsedQuery);

    const selectQuery = `
      SELECT *
      FROM library_api_borrows
      ${whereClause}
      OFFSET ${paginationParams.offset} ROWS FETCH NEXT ${paginationParams.perPage} ROWS ONLY
    `;

    const { rows } = await connection.execute(selectQuery);
    return convertKeysToCamelCase(rows);
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
    const response = await connection.execute(query, bindVars);
    const { rows } = response;

    if (_.isEmpty(rows)) {
      return undefined;
    }
    if (rows.length > 1) {
      throw new Error('Expect a single object but got multiple results.');
    } else {
      const rawBorrowsLower = rows[0];
      return convertKeysToCamelCase([rawBorrowsLower])[0];
    }
  } finally {
    connection.close();
  }
};

/**
 * Update a specific borrow transaction by unique ID and handle DB constraint
 *
 * @param {string} id Unique borrow ID
 * @param {object} updateData Data to update
 * @param {object} existingBorrow Existing borrow to update
 * @returns {Promise<object>} Promise object represents the updated
 *                            borrow or an error object if not found
 */
const updateBorrowById = async (id, updateData, existingBorrow) => {
  const connection = await getConnection();
  let response = {};

  try {
    let borrowData = {
      ...existingBorrow,
      ...updateData,
    };

    borrowData = removeNullKeys(borrowData);
    const updatedBorrowData = convertDatesInObject(borrowData);
    const updateQueryKeys = Object.keys(updatedBorrowData).filter((key) => key !== 'borrowId');
    const updateQueryKeySnake = convertArrayToSnakeCase(updateQueryKeys);

    const updateQuerySet = updateQueryKeySnake.map((key) => {
      if (['borrow_date', 'due_date', 'return_date'].includes(key)) {
        return `${key} = TO_DATE(:${key}, 'YYYY-MM-DD')`;
      }
      return `${key} = :${key}`;
    }).join(', ');

    const updateQuery = `
      UPDATE library_api_borrows
      SET ${updateQuerySet}
      WHERE borrow_id = :borrow_id
    `;

    const bindVars = {
      borrowId: id,
    };

    updateQueryKeys.forEach((key) => {
      if (updatedBorrowData[key] !== null) {
        bindVars[key] = updatedBorrowData[key].toLowerCase();
      }
    });

    const result = await connection.execute(updateQuery, convertToSnakeCase(bindVars));

    if (result.rowsAffected === 1) {
      await connection.commit();
      return getBorrowById(id);
    }

    await connection.rollback();
    throw new Error('Failed to update the borrow transaction.');
  } catch (err) {
    await connection.rollback();

    if (err.errorNum === 2291) {
      response = {
        error: 'Integrity Constraint Violated',
        message: 'Parent key not found. Please ensure the bookId and memberId exist.',
      };
    } else {
      response = {
        error: 'Database Error',
        message: `Failed to update the borrow transaction. Error: ${err.message}`,
      };
    }
    throw response;
  } finally {
    connection.close();
  }
};

/**
 * Posts a new borrow transaction to the Oracle database
 *
 * Inserts the posted borrow transaction into the Oracle database.
 *
 * @param {object} body Request body
 * @returns {Promise<object>} Promise object represents the posted borrow transaction
 */
const postBorrow = async (body) => {
  const connection = await getConnection();
  let response = {};

  try {
    const newBorrowDataRaw = body.data.attributes;
    const currentPstDate = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
    const newBorrowData = {
      bookId: newBorrowDataRaw.bookId,
      memberId: newBorrowDataRaw.memberId,
      borrowDate: newBorrowDataRaw.borrowDate || currentPstDate,
      dueDate: newBorrowDataRaw.dueDate,
      status: 'ongoing', // the status will be 'ongoing' when initially borrowed
    };

    const insertQuery = `
      INSERT INTO library_api_borrows (
        borrow_id,
        book_id,
        member_id,
        borrow_date,
        due_date,
        status
      ) VALUES (
        library_api_borrows_seq.NEXTVAL, -- Use the sequence here
        :bookId,
        :memberId,
        TO_DATE(:borrowDate, 'YYYY-MM-DD'),
        TO_DATE(:dueDate, 'YYYY-MM-DD'),
        :status
      )
      RETURNING borrow_id INTO :insertedId
    `;

    const bindVars = {
      ...newBorrowData,
      insertedId: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
    };

    const result = await connection.execute(insertQuery, bindVars);

    if (result.rowsAffected === 1) {
      await connection.commit();
      newBorrowData.borrowId = result.outBinds.insertedId;
      newBorrowData.returnDate = null;
      return newBorrowData;
    }
    await connection.rollback();
    throw new Error('Failed to insert the borrow transaction.');
  } catch (err) {
    await connection.rollback();

    if (err.errorNum === 2291) {
      response = {
        error: 'Integrity Constraint Violated',
        message: 'Parent key not found. Please ensure the bookId and memberId exist.',
      };
    } else {
      response = {
        error: 'Database Error',
        message: `Failed to insert the borrow transaction. Error: ${err.message}`,
      };
    }

    throw response;
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
