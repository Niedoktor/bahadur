const db = require('./db');
const log = require('./log');

const extendPlayer = (player) => {
  player.getOffices = () => {
    const { getPerson } = require('./getPerson');
    const { getOffice } = require('./getOffice');

    const res = [];
    db.offices.forEach(o => {
      const person = getPerson(o.personId);
      const mip = person.getMostInfluentialPlayer();
      if(mip && mip.id == player.id) res.push(getOffice(o.id));
    });
    return res;
  }
  return player;
}

const getPlayer = (id) => {
  return extendPlayer(db.players.get(id));
}

exports = module.exports = { getPlayer };