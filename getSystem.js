const db = require('./db');
const log = require('./log');

const getSystem = (id) => {
  const obj = db.systems.get(id);

  return obj;
}

exports = module.exports = getSystem;