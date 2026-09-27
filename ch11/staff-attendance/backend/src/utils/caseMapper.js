function toCamelCase(row) {
  if (row === null || row === undefined) return row;

  const result = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

function toCamelCaseList(rows) {
  return rows.map(toCamelCase);
}

module.exports = { toCamelCase, toCamelCaseList };
