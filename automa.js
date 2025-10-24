const db = require('./db');
const log = require('./log');
const game = require('./game');
const { getPerson } = require('./getPerson');

const automa = {
  cards: [
    {
      regions: [1, 2, 3],
      dir: 'right',
      selectRegion: [1, 3],
      selectDir: 1,
      splay: 1,
      setClimate: async (player) => {
        let climate;
        switch (db.company.standing) {
          case 4: climate = 4; break;
          case 6: climate = 2; break;
          default: climate = 0;
        }
        player.climate = climate;
        await player.update();
      }
    }, {
      regions: [1, 2, 3],
      dir: 'left',
      selectRegion: [1, 2],
      selectDir: 1,
      splay: 2,
      setClimate: async (player) => {
        let presCount = 0;
        player.getOffices().forEach(o => {
          if(o.name.startsWith("systemPresident")) presCount++;
        });
        switch(presCount){
          case 3: player.climate = 0; break;
          case 2: player.climate = 2; break;
          default: player.climate = 4;
        }
        await player.update();
      }
    }, {
      regions: [1, 2, 3],
      dir: 'right',
      selectRegion: [1, 3],
      selectDir: 1,
      splay: 3,
      setClimate: async (player) => {
        if(db.company.debt == 0)
          player.climate = 1;
        else if(db.company.debt < 5)
          player.climate = 0;
        else
          player.climate = 4;
        await player.update();
      }
    }, {
      regions: [1, 3, 2],
      dir: 'left',
      selectRegion: [3, 2],
      selectDir: 1,
      splay: 1,
      setClimate: async (player) => {
        if(db.company.standing <= 6)
          player.climate = 3;
        else if(db.company.debt == 8)
          player.climate = 1;
        else
          player.climate = 0;
        await player.update();
      }
    }, {
      regions: [2, 3, 1],
      dir: 'right',
      selectRegion: [2, 1],
      selectDir: 1,
      splay: 2,
      setClimate: async (player) => {
        let res = 0;
        db.systems.forEach(s => {
          if(player.getSpaceyards(s.id).length > 1) res++;
        });
        player.climate = 3 - res;
        if(player.climate > 2) player.climate = 2;
        await player.update();
      }
    }, {
      regions: [2, 3, 1],
      dir: 'right',
      selectRegion: [2, 3],
      selectDir: 2,
      splay: 3,
      setClimate: async (player) => {
        let sum = 0;
        db.company.shares.forEach(s => {
          if(s.personId > 0 && getPerson(s.personId).getMostInfluentialPlayer().id == player.id) sum += s.price;
        });
        if(sum < 7)
          player.climate = 0;
        else if(sum < 9)
          player.climate = 3;
        else
          player.climate = 2;
        await player.update();
      }
    }, {
      regions: [2, 3, 1],
      dir: 'right',
      selectRegion: [2, 1],
      selectDir: 2,
      splay: 1,
      setClimate: async (player) => {
        if(db.company.money <= 8)
          player.climate = 3;
        else if(db.company.money < 17)
          player.climate = 4;
        else
          player.climate = 1;
        await player.update();
      }
    }, {
      regions: [3, 1, 2],
      dir: 'right',
      selectRegion: [3, 2],
      selectDir: 2,
      splay: 2,
      setClimate: async (player) => {

      }
    }, {
      regions: [3, 2, 1],
      dir: 'left',
      selectRegion: [3, 1],
      selectDir: 2,
      splay: 3,
      setClimate: async (player) => {

      }
    }, {
      regions: [3, 1, 2],
      dir: 'left',
      selectRegion: [3, 2],
      selectDir: 2,
      splay: 2,
      setClimate: async (player) => {

      }
    }
  ]
}

exports = module.exports = automa;
