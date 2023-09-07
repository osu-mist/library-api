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

export {
  generateWhereClause,
  generatePaginationParams,
  convertKeysToLowercase,
  formatDateInWhereClause,
};
