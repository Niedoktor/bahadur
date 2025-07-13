let messageLog;
let db;

let playerHelper = {
  init: async (_db, log) => {
    if(log){
      messageLog = log; 
      messageLog("playerHelper.init");
    }

    db = _db;
  },

  getPlayer: (playerId) => {
    return db.players.find((p) => p.id == playerId);
  },

  yardsCount: (playerId) => {
    if(!db.yards) return 0;
    return db.yards.filter((y) => y.ownerId == playerId).length;
  }
}

exports = module.exports = playerHelper;