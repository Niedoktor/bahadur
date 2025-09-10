const db = require('./db');
const log = require('./log');

const getPlayer = (id) => {
  const obj = db.players.get(id);

  return obj;
}

exports = module.exports = getPlayer;