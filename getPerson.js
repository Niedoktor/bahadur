const db = require('./db');
const log = require('./log');
const { getPlayer } = require('./getPlayer');

const extendPerson = (person) => {
  person.influenceString = () => {
    let s = "";
    
    db.players.forEach(p => {
      s += `^[${p.color}]${person.influence[p.id - 1]}`;
    });

    return s;
  }

  person.getMostInfluentialPlayer = () => {
    const infFq = person.influence.reduce(function (arr, curr) {
      return arr[curr] ? ++arr[curr] : arr[curr] = 1, arr
    }, {});

    const infMax = Math.max.apply(null, person.influence);

    if(infFq[infMax] == 1) return getPlayer(person.influence.indexOf(infMax) + 1);

    return undefined;
  }

  return person;
}

const getPerson = (id) => {
  return extendPerson(db.persons.get(id));
}

exports = module.exports = { getPerson };