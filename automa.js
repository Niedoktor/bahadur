const db = require('./db');
const log = require('./log');
const game = require('./game');

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
        changeClimate: () => {

        }
    }, {
        regions: [1, 3, 2],
        dir: 'left',
        selectRegion: [3, 2],
        selectDir: 1,
        splay: 1,
        changeClimate: () => {

        }
    }, {
        regions: [2, 3, 1],
        dir: 'right',
        selectRegion: [2, 1],
        selectDir: 1,
        splay: 2,
        changeClimate: () => {

        }
    }, {
        regions: [2, 3, 1],
        dir: 'right',
        selectRegion: [2, 3],
        selectDir: 2,
        splay: 3,
        changeClimate: () => {

        }
    }, {
        regions: [2, 3, 1],
        dir: 'right',
        selectRegion: [2, 1],
        selectDir: 2,
        splay: 1,
        changeClimate: () => {

        }
    }, {
        regions: [3, 1, 2],
        dir: 'right',
        selectRegion: [3, 2],
        selectDir: 2,
        splay: 2,
        changeClimate: () => {

        }
    }, {
        regions: [3, 2, 1],
        dir: 'left',
        selectRegion: [3, 1],
        selectDir: 2,
        splay: 3,
        changeClimate: () => {

        }
    }, {
        regions: [3, 1, 2],
        dir: 'left',
        selectRegion: [3, 2],
        selectDir: 2,
        splay: 2,
        changeClimate: () => {

        }
    }
  ]
}

exports = module.exports = automa;
