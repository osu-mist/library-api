import _ from 'lodash';

const operatorSymbols = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  neq: '!=',
  fuzzy: 'LIKE',
};

/**
 * Return parsed query with keys changed to remove the "filter[]" wrapper
 *
 * @param {object} query query parameters
 * @returns {object} parsed query
 */
const parseQuery = (query) => {
  const parsedQuery = {};
  _.forEach(query, (value, key) => {
    const regexPattern = /filter\[(.+?)\](\[(.+?)\]){0,1}/g;
    const matched = regexPattern.exec(key);
    if (matched && matched.length > 1) {
      // array destructuring. only need the 1st and 3rd element
      const [, parsedKey, , operator] = matched;
      if (operator) {
        parsedQuery[parsedKey] = { operator: operatorSymbols[operator] || operator, value };
      } else {
        parsedQuery[parsedKey] = value;
      }
    } else {
      parsedQuery[key] = value;
    }
  });

  return parsedQuery;
};

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

export { parseQuery, generateWhereClause };
