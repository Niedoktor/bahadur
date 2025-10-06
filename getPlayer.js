const db = require('./db');
const log = require('./log');

const extendPlayer = (player) => {
  return player;
}

const getPlayer = (id) => {
  return extendPlayer(db.players.get(id));
}

exports = module.exports = { getPlayer };