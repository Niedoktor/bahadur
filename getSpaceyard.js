const db = require('./db');
const log = require('./log');

const getSpaceyard = (spaceshipName) => {
  const obj = db.spaceyards.find(o => o.spaceshipName == spaceshipName);

  return obj;
}

exports = module.exports = getSpaceyard;