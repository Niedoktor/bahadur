let messageLog;
let db;

let playerHelper = {
  init: async (_db) => {
    db = _db;
  },

  getPlayer: (playerId) => {
    return db.players.find((p) => p.id == playerId);
  },

  spaceyardsCount: (playerId) => {
    if(!db.spaceyards) return 0;
    return db.spaceyards.filter((y) => y.ownerId == playerId).length;
  }
}

exports = module.exports = playerHelper;