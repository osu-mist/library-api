import _ from 'lodash';
import oracledb from 'oracledb';

import { parseQuery } from 'utils/parse-query';
import { generateWhereClause, generatePaginationParams, convertKeysToLowercase } from 'utils/dao-helper';

import { getConnection } from './connection';

/**
 * Return a list of members with pagination
 *
 * @param {object} query Query parameters
 * @returns {Promise<object>[]} Promise object represents a list of members
 */
const getMembers = async (query) => {
  const connection = await getConnection();
  try {
    const parsedQuery = parseQuery(query);
    const whereClause = generateWhereClause(parsedQuery).toLowerCase();
    const paginationParams = generatePaginationParams(parsedQuery);

    const selectQuery = `
      SELECT *
      FROM library_api_members
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
 * Return a specific member by unique ID
 *
 * @param {string} id Unique member ID
 * @returns {Promise<object>} Promise object represents a specific member or return undefined if
 *                            not found
 */
const getMemberById = async (id) => {
  const connection = await getConnection();
  const query = `
    SELECT *
    FROM library_api_members
    WHERE memberid = :memberId
  `;

  try {
    const bindVars = { memberId: id };

    const { rows } = await connection.execute(query, bindVars);
    if (_.isEmpty(rows)) {
      return undefined;
    }
    if (rows.length > 1) {
      throw new Error('Expect a single object but got multiple results.');
    } else {
      const rawMembersLower = rows[0];
      return convertKeysToLowercase([rawMembersLower])[0];
    }
  } finally {
    connection.close();
  }
};

/**
 * Update a specific member by unique ID
 *
 * @param {string} id Unique member ID
 * @param {object} updateData Data to update
 * @param {object} existingMember Existing member to update
 * @returns {Promise<object>} Promise object represents the updated member or undefined if not found
 */
const updateMemberById = async (id, updateData, existingMember) => {
  const connection = await getConnection();

  try {
    const lowercaseUpdateData = convertKeysToLowercase([updateData])[0];
    const updatedMemberData = {
      ...existingMember,
      ...lowercaseUpdateData,
    };

    const updateQueryKeys = Object.keys(updatedMemberData).filter((key) => key !== 'memberid');
    const updateQuerySet = updateQueryKeys.map((key) => `${key} = :${key}`).join(', ');

    const updateQuery = `
    UPDATE library_api_members
    SET ${updateQuerySet}
    WHERE memberid = :memberId
  `;
    const bindVars = {
      memberId: id,
    };

    updateQueryKeys.forEach((key) => {
      bindVars[key] = key === 'state' ? updatedMemberData[key].toUpperCase() : updatedMemberData[key].toLowerCase();
    });

    const result = await connection.execute(updateQuery, bindVars);

    if (result.rowsAffected === 1) {
      await connection.commit();
      connection.close();
      return getMemberById(id);
    }
    await connection.rollback();
    throw new Error(`Failed to update the member. Error: ${result.errorNum}`);
  } finally {
    connection.close();
  }
};

/**
 * Posts a new member to the Oracle database
 *
 * Inserts the posted member into the Oracle database.
 *
 * @param {object} body Request body
 * @returns {Promise<object>} Promise object represents the posted member
 */
const postMember = async (body) => {
  const connection = await getConnection();

  try {
    const newMemberDataRaw = body.data.attributes;
    const newMemberData = {
      firstname: newMemberDataRaw.firstName.toLowerCase(),
      lastname: newMemberDataRaw.lastName.toLowerCase(),
      email: newMemberDataRaw.email.toLowerCase(),
      address: newMemberDataRaw.address.toLowerCase(),
      city: newMemberDataRaw.city.toLowerCase(),
      state: newMemberDataRaw.state.toUpperCase(),
      country: newMemberDataRaw.country.toLowerCase(),
      phonenumber: newMemberDataRaw.phoneNumber,
      status: 'active',
    };

    const insertQuery = `
    INSERT INTO library_api_members (
      memberid,
      firstName,
      lastName,
      email,
      address,
      city,
      state,
      country,
      phoneNumber,
      status
    ) VALUES (
      library_api_members_seq.NEXTVAL,
      :firstname,
      :lastname,
      :email,
      :address,
      :city,
      :state,
      :country,
      :phonenumber,
      :status
    )
    RETURNING memberid INTO :insertedId
  `; // Fetch the inserted ID

    const bindVars = {
      ...newMemberData,
      insertedId: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
    };

    const result = await connection.execute(insertQuery, bindVars);

    if (result.rowsAffected === 1) {
      await connection.commit();
      newMemberData.memberid = result.outBinds.insertedId;
      return newMemberData;
    }
    await connection.rollback();
    throw new Error(`Failed to insert the member. Error: ${result.errorNum}`);
  } finally {
    connection.close();
  }
};

export {
  getMembers,
  getMemberById,
  updateMemberById,
  postMember,
};
