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

// Ath hvort innsend json gögn séu í lagi
const jsonValidation = [
  sanitize(['title', 'text', 'datetime']).trim(),
  body('title', { field: 'title', message: 'Title must be a string of length 1 to 255 characters' })
    .isLength({ min: 1, max: 255 })
    .custom(value => typeof value === 'string'),
  body('text').custom(value => typeof value === 'string').withMessage({
    field: 'text', message: 'Text must be a string',
  }),
  body('datetime').isISO8601().withMessage({
    field: 'datetime', message: 'Datetime must be ISO 8601 date',
  }),
];

// Fall sem kallar á readAll til að sækja gögn
async function data(req, res) {
  const rows = await readAll();
  return res.json(rows);
}

// Fall sem kallar á readOne til að sækja gögn með ákveðið id
async function idData(req, res) {
  const { id } = req.params;
  const row = await readOne(id);

  // row er object (truthy) ef lina til með þessu id, annars undefined (falsy)
  if (row) {
    return res.json(row);
  }

  return res.status(404).json({ error: 'Not found' });
}

// Fall sem vinnur úr gögnum og kallar á create til að búa til röð í töflu
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

  // Sækja villur úr validationResult
  const errors = validationResult(req);

  // Ef það voru villur (gögn ekki rétt slegin inn), þá birta villur
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(i => i.msg);
    return res.status(400).json(errorMessages);
  }

  // Annars kalla á create til að búa til note/röð og birta síðan þau gögn
  const inserted = await create(readyData);
  return res.status(201).json(inserted);
}

// Fall til sem kallar á update til að 'put'/update-a röð í töflu
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

  // kalla á update til að breyta röð með id, update skilar 'rows' sem er röðin sem
  // hún uppfærði, ef engin röð með þetta id þá skilar hún undefined
  const updated = await update(id, readyData);

  // Ath hvort undefined var skilað (þá var enginn röð með þetta id)
  if (!updated) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.status(201).json(updated);
}

// Fall sem kallar á del til að eyða röð með id
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
