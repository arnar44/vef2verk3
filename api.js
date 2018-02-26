const express = require('express');
const xss = require('xss');
const { body, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');

const {
  create,
  readAll,
  readOne,
  update,
  del,
} = require('./notes');

const router = express.Router();

const jsonValidation = [
  sanitize(['title', 'text', 'datetime']).trim(),
  body('title').isLength({ min: 1, max: 255 }).withMessage({
    field: 'title', message: 'Title must be a string of length 1 to 255 characters',
  }),
  body('text').custom(value => typeof value === 'string').withMessage({
    field: 'text', message: 'Text must be a string',
  }),
  body('datetime').isISO8601().withMessage({
    field: 'datetime', message: 'Datetime must be ISO 8601 date',
  }),
];

async function data(req, res) {
  const rows = await readAll();
  return res.json(rows);
}

async function idData(req, res) {
  const { id } = req.params;
  const row = await readOne(id);

  if (row) {
    return res.json(row);
  }

  return res.status(404).json({ error: 'Not found' });
}

async function createNote(req, res) {
  // fá öll gögn úr innsenda json
  const {
    body: {
      title = '',
      text = '',
      datetime = '',
    } = {},
  } = req;

    // öll gögn hreinsuð
  const readyData = {
    title: xss(title),
    text: xss(text),
    datetime: xss(datetime),
  };

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(i => i.msg);
    return res.status(400).json(errorMessages);
  }

  const inserted = await create(readyData);
  return res.status(201).json(inserted);
}

async function updateNote(req, res) {
  const { id } = req.params;
  // fá öll gögn úr innsenda json
  const {
    body: {
      title = '',
      text = '',
      datetime = '',
    } = {},
  } = req;

  // öll gögn hreinsuð
  const readyData = {
    title: xss(title),
    text: xss(text),
    datetime: xss(datetime),
  };

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(i => i.msg);
    return res.status(400).json(errorMessages);
  }

  const updated = await update(id, readyData);

  if (Object.keys(updated).length === 0) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.status(201).json(updated);
}

async function idDelete(req, res) {
  const { id } = req.params;
  const existed = await del(id);

  // id var til, náðum að eyða
  if (existed) {
    return res.status(204).end();
  }

  return res.status(404).json({ error: 'Not found' });
}

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

router.get('/', catchErrors(data));
router.get('/:id', catchErrors(idData));
router.post('/', jsonValidation, catchErrors(createNote));
router.delete('/:id', catchErrors(idDelete));
router.put('/:id', jsonValidation, catchErrors(updateNote));


module.exports = router;
