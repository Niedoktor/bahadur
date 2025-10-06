const db = require('./db');
const log = require('./log');

const extendSpaceyard = (spaceyard) => {
  return spaceyard;
}

const getSpaceyard = (id) => {
  return extendSpaceyard(db.spaceyards.get(id));
}

const getSpaceyardByName = (spaceshipName) => {
  return extendSpaceyard(db.spaceyards.find(o => o.spaceshipName == spaceshipName));
}

exports = module.exports = { getSpaceyard, getSpaceyardByName };