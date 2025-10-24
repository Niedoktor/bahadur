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

  player.getSpaceyards = (systemId) => {
    const { getSpaceyard } = require('./getSpaceyard');

    const res = [];
    db.spaceyards.forEach(o => {
      if(o.playerId == player.id && (!systemId || o.systemId == systemId)){
        res.push(getSpaceyard(o.id));
      }
    });
    return res;
  }

  return player;
}

const getPlayer = (id) => {
  return extendPlayer(db.players.get(id));
}

exports = module.exports = { getPlayer };