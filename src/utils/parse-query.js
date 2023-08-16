import _ from 'lodash';

const operatorSymbols = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  neq: '!=',
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
 * Generate a WHERE clause based on parsed filters
 *
 * @param {object} parsedFilters Parsed filter parameters
 * @returns {string} WHERE clause string
 */
const generateWhereClause = (parsedFilters) => {
  const conditions = Object.keys(parsedFilters).map((key) => {
    const filter = parsedFilters[key];

    if (typeof filter === 'string') {
      return `${key} = '${filter}'`;
    } else if (typeof filter === 'object') {
      const { operator, value } = filter;
      return `${key} ${operator} '${value}'`;
    }
    // Add a default return value in case none of the conditions match
    return '';
  });

  const filteredConditions = conditions.filter(Boolean);

  if (filteredConditions.length > 0) {
    return `WHERE ${filteredConditions.join(' AND ')}`;
  }
  return '';
};

export { parseQuery, generateWhereClause };
