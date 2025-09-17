const helpers = require('./helpers');
const { faker } = require('@faker-js/faker');
const db = require('./db');
const log = require('./log');
const game = require('./game');

const setup = {
  cards: [
    {
      "office": "chancellor"
    },{
      "office": "militaryAffairs",
      "spaceyard": 3,
      "money": 1
    },{
      "executive": 2,
      "officer": 2,
      "money": 3,
    },{
      "office": "shippingManager",
      "shareholder": 0,
      "money": 2
    },{
      "officer": 1,
      "executive": 1,
      "money": 4
    },{
      "officer": 3,
      "executive": 3,
      "money": 3
    },{
      "spaceyard": 1,
      "money": 4
    },{
      "office": "chairman",
      "shareholder": 0,
      "money": 1
    },{
      "office": "systemPresident1",
      "shareholder": 0,
      "money": 1
    },{
      "office": "systemPresident2",
      "shareholder": 0,
      "money": 1
    },{
      "office": "systemPresident3",
      "shareholder": 0
    },{
      "office": "tradeDirector",
      "spaceyard": 2,
      "money": 1
    }],
  
  newGame: async () => {
    log.append("--- RESET BEGIN!---");

    await db.deleteAll();

    let prices = {
      "spaceyard": 2,
      "factory": 5,
      "luxury": 4,
      "investor": 0,
      "officer": 1,
      "executive": 1,
      "influence": 2,
      "office": 2
    }

    let obj = await db.createObject("prices", prices);
    await obj.update();

    let main = {
      "turn": 1,
      "phase": "invest"
    }

    obj = await db.createObject("main", main);
    await obj.update();

    let player1 = {
      "id": 1,
      "money": 0,
      "lastAction": "",
      "influence": 0,
      "color": "yellow"
    }

    let tab = await db.createTable("players");

    let row = await tab.createRow(player1);
    await row.update();

    let player2 = {
      "id": 2,
      "money": 0,
      "influence": 0,
      "color": "cyan"
    }

    row = await tab.createRow(player2);
    await row.update();

    let company = {
      "money": 5,
      "reputation": 4,
      "debt": 0,
      "shares": [
        {
          "price": 2,
          "personId": 0
        },
        {
          "price": 3,
          "personId": 0
        },
        {
          "price": 3,
          "personId": 0
        },
        {
          "price": 4,
          "personId": 0
        },
        {
          "price": 5,
          "personId": 0
        },
      ],
      "shareholders": []
    }

    obj = await db.createObject("company", company);
    await obj.update();

    tab = await db.createTable("offices");

    let office = {
      "name": "chancellor",
      "label": "CHANCELLOR",
      "personId": 0,
      "hasTreasury": false,
      "hasExecutives": false
    }

    row = await tab.createRow(office);
    await row.update();

    office = {
      "name": "chairman",
      "label": "CHAIRMAN",
      "personId": 0,
      "hasTreasury": false,
      "hasExecutives": false
    }

    row = await tab.createRow(office);
    await row.update();

    office = {
      "name": "tradeDirector",
      "label": "TRADE DIRECTOR",
      "personId": 0,
      "hasTreasury": true,
      "money": 3,
      "hasExecutives": false
    }

    row = await tab.createRow(office);
    await row.update();

    office = {
      "name": "shippingManager",
      "label": "SHIPPING MANAGER",
      "personId": 0,
      "hasTreasury": true,
      "money": 3,
      "hasExecutives": false
    }

    row = await tab.createRow(office);
    await row.update();

    office = {
      "name": "militaryAffairs",
      "label": "MILITARY AFFAIRS",
      "personId": 0,
      "hasTreasury": false,
      "hasExecutives": false,
      "ensigns": []
    }

    row = await tab.createRow(office);
    await row.update();

    tab = await db.createTable("spaceyards");
    tab = await db.createTable("systems");
    tab = await db.createTable("persons");
    tab = await db.createTable("executives");
    tab = await db.createTable("officers");
    tab = await db.createTable("planets");

    for(let i = 0; i < 3; i++){
      let system = {
        "name": faker.location.county().replace(" County", "").replace("shire", "").replace("County ", "").replace("West ", "").replace("East ", "").replace("South ", "").replace("North ", "")
      }

      row = await db.systems.createRow(system);
      await row.update();

      office = {
        "name": "systemPresident" + system.id,
        "label": "PRESIDENT",
        "personId": 0,
        "hasTreasury": true,
        "hasExecutives": true,
        "systemId": system.id,
        "money": 3
      }

      row = await db.offices.createRow(office);
      await row.update();

      let order = 1;
      for(let j = 0; j < 3 + system.id; j++){
        let planet = {
          "name": `${order} ${faker.location.city().replace("West ", "").replace("East ", "").replace("South ", "").replace("North ", "")}`,
          "systemId": system.id,
          "order": order++
        }

        row = await db.planets.createRow(planet);
        await row.update();
      }
    }

    for(let c = 0; c < setup.cards.length; c++){
      const card = setup.cards[c];
      card.infSum = 0;

      if(card.office) card.infSum += db.prices.office;
      if(card.executive) card.infSum += db.prices.executive;
      if(card.officer) card.infSum += db.prices.officer;
      if(card.shareholder) card.infSum += db.company.shares[0].price;
    }

    setup.cards.sort((a, b) => { return b.infSum - a.infSum});

    let infPool = 2;
    for(let c = 0; c < setup.cards.length / db.players.length; c++){
      infPool += setup.cards[c].infSum;
    }

    db.players.forEach(p => { p.influence = infPool });
    
    helpers.shuffleArray(setup.cards);

    let pId = 1;
    for(let c = 0; c < setup.cards.length; c++){
      const card = setup.cards[c];

      if(card.office){
        const office = db.offices.find(o => o.name == card.office);
        const person = await game.hirePerson(pId, db.prices.office);
        office.personId = person.id;
        await office.update();
      }

      if(card.spaceyard){
        await game.buySpaceyard(pId, card.spaceyard);
      }

      if(card.shareholder){
        await game.hireShareholder(pId, card.shareholder, db.company.shares[card.shareholder].price);
      }

      if(card.executive){
        await game.hireExecutive(pId, card.executive, db.prices.executive);
      }

      if(card.officer){
        const person = await game.hirePerson(pId, db.prices.officer);
        await game.assignOfficer(person.personId, card.officer, true);
      }

      if(card.money){
        const player = db.players.get(pId);
        player.money += card.money;
      }

      if(pId < db.players.length)
        pId++;
      else
        pId = 1;
    };

    await db.players.update();

    log.append("--- RESET DONE!---");
  }
}

exports = module.exports = setup;