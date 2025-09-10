const db = require('./db');
const log = require('./log');
const getPlayer = require('./getPlayer');

const getPerson = (id) => {
  const obj = db.persons.get(id);

  obj.influenceString = () => {
    let s = "";
    
    db.players.forEach(p => {
      s += `^[${p.color}]${obj.influence[p.id - 1]}`;
    });

    return s;
  }

  obj.getMostInfluentialPlayer = () => {
    const infFq = obj.influence.reduce(function (arr, curr) {
      return arr[curr] ? ++arr[curr] : arr[curr] = 1, arr
    }, {});

    const infMax = Math.max.apply(null, obj.influence);

    if(infFq[infMax] == 1) return getPlayer(obj.influence.indexOf(infMax) + 1);

    return undefined;
  }

  return obj;
}

exports = module.exports = getPerson;