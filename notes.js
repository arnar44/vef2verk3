/* todo sækja pakka sem vantar  */
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgres://Arnar:12345@localhost/v3';

/**
 * Create a note asynchronously.
 *
 * @param {Object} note - Note to create
 * @param {string} note.title - Title of note
 * @param {string} note.text - Text of note
 * @param {string} note.datetime - Datetime of note
 *
 * @returns {Promise} Promise representing the object result of creating the note
 */
async function create({ title, text, datetime } = {}) {
  const client = new Client({ connectionString });
  await client.connect();

  const query = 'INSERT INTO notes(datetime, title, text) VALUES ($1, $2, $3) RETURNING *';
  const values = [datetime, title, text];

  try {
    const result = await client.query(query, values);
    const { rows } = result;
    return rows;
  } catch (err) {
    console.error('Error inserting data');
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Read all notes.
 *
 * @returns {Promise} Promise representing an array of all note objects
 */
async function readAll() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query('SELECT * FROM notes ORDER BY id');
    const { rows } = result;
    return rows;
  } catch (err) {
    console.error('Error selecting from data');
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Read a single note.
 *
 * @param {number} id - Id of note
 *
 * @returns {Promise} Promise representing the note object or null if not found
 */
async function readOne(id) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query('SELECT * FROM notes WHERE id=$1', [id]);
    const { rows } = result;
    return rows[0];
  } catch (err) {
    console.error('Error selecting from data');
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Update a note asynchronously.
 *
 * @param {number} id - Id of note to update
 * @param {Object} note - Note to create
 * @param {string} note.title - Title of note
 * @param {string} note.text - Text of note
 * @param {string} note.datetime - Datetime of note
 *
 * @returns {Promise} Promise representing the object result of creating the note
 */
async function update(id, { title, text, datetime } = {}) {
  const client = new Client({ connectionString });
  await client.connect();

  const query = 'UPDATE notes SET datetime = $1, title = $2, text = $3 WHERE id=$4 RETURNING *';
  const values = [datetime, title, text, id];

  try {
    const result = await client.query(query, values);
    const { rows } = result;
    return rows;
  } catch (err) {
    console.error('Error updating data');
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Delete a note asynchronously.
 *
 * @param {number} id - Id of note to delete
 *
 * @returns {Promise} Promise representing the boolean result of creating the note
 */
async function del(id) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    // skilar id ef það var til (hægt að eyða) annars []
    const deleted = await client.query('DELETE FROM notes WHERE id=$1 RETURNING id', [id]);
    const { rowCount } = deleted;
    // Skilar 0 ef id ekki til, annars 1
    return rowCount;
  } catch (err) {
    console.error('Error deleting from data');
    throw err;
  } finally {
    await client.end();
  }
}

module.exports = {
  create,
  readAll,
  readOne,
  update,
  del,
};
