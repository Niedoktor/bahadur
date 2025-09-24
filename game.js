const { faker } = require('@faker-js/faker');
const helpers = require('./helpers');
const db = require('./db');
const log = require('./log');

const game = {
  buySpaceyard: async (playerId, systemId, price) => {
    let player = db.players.get(playerId);

    if(price){
      if(player.money < price) return undefined;
      player.money -= price;
    }

    let yard = {
      "playerId": playerId,
      "spaceshipName": helpers.toCapitalCase(faker.word.words({ count: { min: 1, max: 2 }})),
      "spaceshipIntegrity": 100,
      "systemId": systemId == undefined ? 0 : systemId
    }

    let obj = await db.spaceyards.createRow(yard);
    await obj.update();

    return obj;
  },

  hireOfficer: async (playerId, influence) => {
    let player = db.players.get(playerId);

    if(influence && player.influence < influence) return undefined;

    const office = db.offices.find(o => o.name == "militaryAffairs");
    const p = await game.hirePerson(playerId, influence);

    office.ensigns.push(p.id);
    await office.update();
  },

  hireShareholder: async (playerId, shareIdx, influence) => {
    let player = db.players.get(playerId);

    if(influence && player.influence < influence) return undefined;

    const p = await game.hirePerson(playerId, influence);

    db.company.shares[shareIdx].personId = p.id;
    await db.company.update();
  },

  hireExecutive: async (playerId, systemId, influence) => {
    let player = db.players.get(playerId);

    if(influence && player.influence < influence) return undefined;

    const office = db.offices.find(o => o.systemId == systemId);
    const p = await game.hirePerson(playerId, influence);

    const executive = {
      "officeId": office.id,
      "systemId": systemId,
      "personId": p.id
    }

    let obj = await db.executives.createRow(executive);
    await obj.update();
  },

  assignOfficer: async (personId, systemId, isCommander) => {
    const officer = {
      "systemId": systemId,
      "personId": personId,
      "isCommander": isCommander
    }

    let obj = await db.officers.createRow(officer);
    await obj.update();
  },

  assignShareholder: async (personId) => {
    db.company.shareholders.push(personId);
    await db.company.update();
  },

  hirePerson: async (playerId, influence) => {
    let player = db.players.get(playerId);

    let person = {
      "name": faker.person.fullName(),
      "influence": Array(db.players.length).fill(0),
    }
    
    if(influence){
      person.influence[playerId - 1] = influence;
      player.influence -= influence;
      person.influencedBy = playerId;
    }

    let obj = await db.persons.createRow(person);
    await obj.update();

    return obj;
  }
}

exports = module.exports = game;