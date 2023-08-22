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

    const pageNumber = parseInt(parsedQuery['page[number]'], 10) || 1;
    const perPage = parseInt(parsedQuery['page[size]'], 10) || 25;
    const offset = (pageNumber - 1) * perPage;

    const selectQuery = `
      SELECT *
      FROM library_api_members
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
    WHERE member_id = :memberId
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
      const rawMembers = Object.keys(rawMembersLower).reduce((result, key) => {
        result[key.toLowerCase()] = rawMembersLower[key];
        return result;
      }, {});
      return rawMembers;
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
 * @param {object} existingMember Exisitng member to update
 * @returns {Promise<object>} Promise object represents the updated member or undefined if not found
 */
const updateMemberById = async (id, updateData, existingMember) => {
  const connection = await getConnection();

  try {
    const updatedMemberData = {
      ...existingMember,
      ...updateData,
    };

    const updateQuery = `
    UPDATE library_api_members
    SET firstName = :firstName,
        lastName = :lastName,
        email = :email,
        address = :address,
        city = :city,
        state = :state,
        country = :country,
        phoneNumber = :phoneNumber,
        status = :status
    WHERE member_id = :memberId
  `;

    const bindVars = {
      firstName: updatedMemberData.firstName.toLowerCase(),
      lastName: updatedMemberData.lastName.toLowerCase(),
      email: updatedMemberData.email.toLowerCase(),
      address: updatedMemberData.address.toLowerCase(),
      city: updatedMemberData.city.toLowerCase(),
      state: updatedMemberData.state.toUpperCase(),
      country: updatedMemberData.country.toLowerCase(),
      phoneNumber: updatedMemberData.phoneNumber,
      status: updatedMemberData.status.toLowerCase(),
      memberId: id,
    };

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
      ...newMemberDataRaw,
      firstname: newMemberDataRaw.firstName,
      lastname: newMemberDataRaw.lastName,
      phonenumber: newMemberDataRaw.phoneNumber,
    };
    newMemberData.status = 'active';
    const insertQuery = `
    INSERT INTO library_api_members (
      member_id,
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
      :firstName,
      :lastName,
      :email,
      :address,
      :city,
      :state,
      :country,
      :phoneNumber,
      :status
    )
    RETURNING member_id INTO :insertedId
  `; // Fetch the inserted ID

    const bindVars = {
      firstname: newMemberData.firstname.toLowerCase(),
      lastname: newMemberData.lastname.toLowerCase(),
      email: newMemberData.email.toLowerCase(),
      address: newMemberData.address.toLowerCase(),
      city: newMemberData.city.toLowerCase(),
      state: newMemberData.state.toUpperCase(),
      country: newMemberData.country.toLowerCase(),
      phonenumber: newMemberData.phonenumber,
      status: newMemberData.status.toLowerCase(),
      insertedId: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
    };

    const result = await connection.execute(insertQuery, bindVars);

    if (result.rowsAffected === 1) {
      await connection.commit();
      newMemberData.member_id = result.outBinds.insertedId;
      const lowercaseMemberData = {
        member_id: newMemberData.member_id,
        firstname: newMemberData.firstname.toLowerCase(),
        lastname: newMemberData.lastname.toLowerCase(),
        email: newMemberData.email.toLowerCase(),
        address: newMemberData.address.toLowerCase(),
        city: newMemberData.city.toLowerCase(),
        state: newMemberData.state.toUpperCase(),
        country: newMemberData.country.toLowerCase(),
        phonenumber: newMemberData.phonenumber,
        status: newMemberData.status.toLowerCase(),
      };

      return lowercaseMemberData;
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
