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
    }

    if (typeof filter === 'object') {
      // If the filter is an object, extract operator and value
      // such as: 'key = author, SQL operator = LIKE, Value = Paulo'
      const { operator, value } = filter;

      // Handle the LIKE operator for text searching with %
      if (operator === 'LIKE') {
        return `${key} ${operator} '%${value}%'`;
      }

      // For other supported operators, create the condition
      return `${key} ${operator} '${value}'`;
    }

    // Return an empty string for unsupported conditions
    return '';
  });

  // Filter out empty conditions and join them with 'AND'
  const filteredConditions = conditions.filter(Boolean);
  if (filteredConditions.length > 0) {
    return `WHERE ${filteredConditions.join(' AND ')}`;
  }
  return ''; // Return an empty string when no conditions are provided
};

/**
 * Generate pagination parameters
 *
 * @param {object} parsedQuery Parsed query parameters
 * @returns {object} Pagination parameters object
 */
const generatePaginationParams = (parsedQuery) => {
  const pageNumber = parseInt(parsedQuery['page[number]'], 10) || 1;
  const perPage = parseInt(parsedQuery['page[size]'], 10) || 25;
  const offset = (pageNumber - 1) * perPage;

  return {
    pageNumber,
    perPage,
    offset,
  };
};

/**
 * Convert keys of objects in an array to lowercase
 *
 * @param {Array} arrayOfObjects Array of objects to be converted
 * @returns {Array} Array of objects with lowercase keys
 */
const convertKeysToLowercase = (arrayOfObjects) => (
  arrayOfObjects.map((item) => {
    const newItem = {};
    Object.keys(item).forEach((key) => {
      newItem[key.toLowerCase()] = item[key];
    });
    return newItem;
  })
);

/**
 * Formats date literals in a WHERE clause SQL string
 * to use the TO_DATE function in Oracle SQL.
 *
 * @param {string} whereClause - The original WHERE clause
 * @returns {string} - The modified WHERE clause with date literals converted
 */
const formatDateInWhereClause = (whereClause) => {
  // The regex pattern matches dates in 'YYYY-MM-DD' format
  const datePattern = /'\d{4}-\d{2}-\d{2}'/g;

  // Replace all instances of date patterns with TO_DATE function
  return whereClause.replace(datePattern, (match) => `TO_DATE(${match}, 'YYYY-MM-DD')`);
};

/**
 * Converts a date string from 'DD-MMM-YY' to 'YYYY-MM-DD' format.
 *
 * @param {string} date - The date string in 'DD-MMM-YY' format.
 * @returns {string} - The date string in 'YYYY-MM-DD' format.
 */
const convertDate = (date) => {
  const monthMap = {
    JAN: '01',
    FEB: '02',
    MAR: '03',
    APR: '04',
    MAY: '05',
    JUN: '06',
    JUL: '07',
    AUG: '08',
    SEP: '09',
    OCT: '10',
    NOV: '11',
    DEC: '12',
  };

  const [day, month, year] = date.toUpperCase().split('-');
  return `20${year}-${monthMap[month]}-${day}`;
};

/**
 * Converts all date strings in an object from 'DD-MMM-YY' to 'YYYY-MM-DD' format.
 *
 * @param {object} data - The object containing date strings.
 * @returns {object} - The object with converted date strings.
 */
const convertDatesInObject = (data) => {
  const isAlreadyCorrectFormat = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (typeof value === 'string' && value.includes('-') && !isAlreadyCorrectFormat(value)) {
      data[key] = convertDate(value);
    }
  });
  return data;
};

/**
 * Converts all keys in an array of objects from snake_case or UPPERCASE to camelCase.
 *
 * @param {Array<Object>} rows - The array of objects with keys to be converted.
 * @returns {Array<Object>} A new array of objects with keys converted to camelCase.
 */
const convertKeysToCamelCase = (rows) => {
  return rows.map(row => {
    return Object.keys(row).reduce((acc, key) => {
      const camelCaseKey = key.toLowerCase().replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      acc[camelCaseKey] = row[key];
      return acc;
    }, {});
  });
};

/**
 * Converts an object's keys from camelCase to snake_case, except for 'page[number]' and 'page[size]'.
 *
 * @param {Object} obj - The object with keys to be converted.
 * @returns {Object} A new object with keys converted to snake_case.
 */
const convertToSnakeCase = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (key === 'page[number]' || key === 'page[size]') {
      acc[key] = obj[key];
    } else {
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      acc[snakeCaseKey] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Converts an array of camelCase strings to snake_case.
 *
 * @param {Array<string>} updateQueryKeys - The array of camelCase strings.
 * @returns {Array<string>} A new array of strings converted to snake_case.
 */
const convertArrayToSnakeCase = (updateQueryKeys) => {
  return updateQueryKeys.map(key => key.replace(/([A-Z])/g, '_$1').toLowerCase());
};

export {
  generateWhereClause,
  generatePaginationParams,
  convertKeysToLowercase,
  formatDateInWhereClause,
  convertDate,
  convertDatesInObject,
  convertKeysToCamelCase,
  convertToSnakeCase,
  convertArrayToSnakeCase,
};
