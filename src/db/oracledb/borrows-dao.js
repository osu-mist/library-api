import _ from 'lodash';
import oracledb from 'oracledb';

import { parseQuery } from 'utils/parse-query';
import {
  generateWhereClause,
  generatePaginationParams,
  convertKeysToLowercase,
  formatDateInWhereClause,
  convertDatesInObject,
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
    const originalWhereClause = generateWhereClause(parsedQuery).toLowerCase();
    const whereClause = formatDateInWhereClause(originalWhereClause);
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
    WHERE borrowid = :borrowId
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
      return convertKeysToLowercase([rawBorrowsLower])[0];
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
    const lowercaseUpdateData = convertKeysToLowercase([updateData])[0];
    const borrowData = {
      ...existingBorrow,
      ...lowercaseUpdateData,
    };

    const updatedBorrowData = convertDatesInObject(borrowData);

    const updateQueryKeys = Object.keys(updatedBorrowData).filter((key) => key !== 'borrowid');
    const updateQuerySet = updateQueryKeys.map((key) => {
      if (['borrowdate', 'duedate', 'returndate'].includes(key)) {
        return `${key} = TO_DATE(:${key}, 'YYYY-MM-DD')`;
      }
      return `${key} = :${key}`;
    }).join(', ');

    const updateQuery = `
      UPDATE library_api_borrows
      SET ${updateQuerySet}
      WHERE borrowid = :borrowId
    `;

    const bindVars = {
      borrowId: id,
    };

    updateQueryKeys.forEach((key) => {
      if (updatedBorrowData[key] !== null) {
        bindVars[key] = updatedBorrowData[key].toLowerCase();
      }
    });

    const result = await connection.execute(updateQuery, bindVars);

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
    const currentPSTDate = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
    const newBorrowData = {
      bookid: newBorrowDataRaw.bookId,
      memberid: newBorrowDataRaw.memberId,
      borrowdate: newBorrowDataRaw.borrowDate || currentPSTDate,
      duedate: newBorrowDataRaw.dueDate,
      status: 'ongoing', // the status will be 'ongoing' when initially borrowed
    };

    const insertQuery = `
      INSERT INTO library_api_borrows (
        borrowid,
        bookid,
        memberid,
        borrowdate,
        duedate,
        status
      ) VALUES (
        library_api_borrows_seq.NEXTVAL, -- Use the sequence here
        :bookid,
        :memberid,
        TO_DATE(:borrowdate, 'YYYY-MM-DD'),
        TO_DATE(:duedate, 'YYYY-MM-DD'),
        :status
      )
      RETURNING borrowid INTO :insertedId
    `;

    const bindVars = {
      ...newBorrowData,
      insertedId: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
    };

    const result = await connection.execute(insertQuery, bindVars);

    if (result.rowsAffected === 1) {
      await connection.commit();
      newBorrowData.borrowid = result.outBinds.insertedId;
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
