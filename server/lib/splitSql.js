/**
 * Split a chunk of SQL text into multiple statements based on ; separator.
 * This honors SQL comments without requiring a SQL parser
 * @param {string} sql
 */
function splitSql(sql) {
  if (typeof sql !== 'string') {
    throw new Error('sql expected to be string');
  }

  const queries = [];

  const lines = sql.split('\n');

  let currentQuery = '';
  let inBlockComment = false;

  lines.forEach(line => {
    const chars = line.split('');
    let inLineComment = false;
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const next = chars[i + 1] || '';
      const both = char + next;
      // if we got two dashes this and rest of line is a comment
      if (!inLineComment && both === '--') {
        inLineComment = true;
      }

      if (!inBlockComment && both === '/*') {
        inBlockComment = true;
      } else if (inBlockComment && both === '*/') {
        inBlockComment = false;
      }

      // add the letter to current query
      currentQuery += char;

      // If we reach a separator and not in comment,
      // Add current query to queries and reset current query
      if (char === ';' && !inBlockComment && !inLineComment) {
        queries.push(currentQuery.trim());
        currentQuery = '';
      }
    }
    currentQuery += '\n';
  });

  return queries;
}

module.exports = splitSql;
