const Joi = require('joi');
const db = require('../lib/db.js');
const passhash = require('../lib/passhash.js');

const schema = {
  _id: Joi.string().optional(), // will be auto-gen by nedb
  email: Joi.string().required(),
  role: Joi.string()
    .lowercase()
    .allow('admin', 'editor', 'viewer'),
  passwordResetId: Joi.string()
    .guid()
    .optional()
    .empty(''),
  passhash: Joi.string().optional(), // may not exist if user hasn't signed up yet
  password: Joi.string()
    .optional()
    .strip(),
  createdDate: Joi.date().default(new Date(), 'time of creation'),
  modifiedDate: Joi.date().default(new Date(), 'time of modification'),
  signupDate: Joi.date().optional()
};

async function save(data) {
  if (!data.email) {
    throw new Error('email required when saving user');
  }

  data.modifiedDate = new Date();

  if (data.password) {
    data.passhash = await passhash.getPasshash(data.password);
  }

  const joiResult = Joi.validate(data, schema);
  if (joiResult.error) {
    return Promise.reject(joiResult.error);
  }

  await db.users.update({ email: data.email }, joiResult.value, {
    upsert: true
  });
  return findOneByEmail(data.email);
}

function findOneByEmail(email) {
  return db.users.findOne({ email: { $regex: new RegExp(email, 'i') } });
}

function findOneById(id) {
  return db.users.findOne({ _id: id });
}

function findOneByPasswordResetId(passwordResetId) {
  return db.users.findOne({ passwordResetId });
}

function findAll() {
  return db.users
    .cfind({}, { password: 0, passhash: 0 })
    .sort({ email: 1 })
    .exec();
}

/**
 * Returns boolean regarding whether admin registration should be open or not
 * @returns {Promise<boolean>} administrationOpen
 */
async function adminRegistrationOpen() {
  const doc = await db.users.findOne({ role: 'admin' });
  return !doc;
}

function removeById(id) {
  return db.users.remove({ _id: id });
}

module.exports = {
  findOneByEmail,
  findOneById,
  findOneByPasswordResetId,
  findAll,
  adminRegistrationOpen,
  removeById,
  save
};
