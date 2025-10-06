const db = require('./db');
const log = require('./log');

const extendSystem = (system) => {
  return system;
}

const getSystem = (id) => {
  return extendSystem(db.systems.get(id));
}

exports = module.exports = { getSystem };