const db = require('./db');
const log = require('./log');

const getOffice = (name) => {
  const obj = db.offices.find(o => o.name == name);

  return obj;
}

exports = module.exports = getOffice;