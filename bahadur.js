const db = require('./db');
const log = require('./log');
const termkit = require('terminal-kit');
const { faker } = require('@faker-js/faker');
const helpers = require('./helpers');
const ui = require('./ui');

let term;

(async () => {
	termkit.getDetectedTerminal(function(error, terminal) {
		term = terminal;

		term.terminate = () => {
			setTimeout(function() {
				term.grabInput(false);
				term.fullscreen(false);
				term.applicationKeypad(false);
				setTimeout(function() { process.exit(); }, 100);
			}, 100);
		}

		term.fullscreen(true);
		term.applicationKeypad();
		term.grabInput({ mouse: 'motion', focus: true });

		term.on('key', function(key, matches, data) {
			switch(key)	{
				case 'CTRL_C': term.terminate(); break;
			}
		});

		term.on('mouse', function(name, data) {
			switch (name) {
			}
			//console.log( "'mouse' event:" , name , data ) ;
		});

		term.on('resize', function() {
			refresh();
		});

		term.clear();
		term.hideCursor(true);

		init();
	});
})()

async function init(){
	await db.init('./data', (msg) => {
		log.append(msg);
	});

	if(db.count == 0) await resetGame();

	ui.init(term);
	refresh();
}

async function confirmSecondInvestSubmit(value) {
	let player = db.players.get(1);

	delete player.confirm;

	if(value == "yes"){
		if(player.lastAction == "share"){
			player.buyingShare = true;
		}else	if(player.lastAction == "executive"){
			player.hiringExecutive = true;
		}else{
			await investAction(player.lastAction);
		}
	}
	player.update();

	refresh();
}

async function investMenuSubmit(value) {
	let player = db.players.get(1);

	await investAction(value);

	let cheapestShare = db.company.shares.find(o => o.personId == 0);
	
	if((player.lastAction == value && player.money >= db.prices[value])
		|| (player.lastAction == "share" && value.startsWith("share") && cheapestShare !== undefined && player.influence >= cheapestShare.price)
		|| (player.lastAction == "executive" && value.startsWith("executive"))){
		player.confirm = true;
	}

	if(value.startsWith("share")){
		player.lastAction = "share";
	}else if(value.startsWith("executive")){
		player.lastAction = "executive";
	}else{
		player.lastAction = value;
	}
	player.update();
	
	refresh();
}

async function investAction(value){
	if(value.startsWith("share")){
		await hireShareholder(1, value);
		ui.document.elements.investMenu.closeSubmenu();
	}else	if(value.startsWith("executive")){
		await hireExecutive(1, value);
		ui.document.elements.investMenu.closeSubmenu();
	}else{
		switch(value){
			case "spaceyard": await buySpaceyard(1); break;
			case "officer": await hireOfficer(1); break;
		}
	}
}

async function gameMenuSubmit(value) {
	switch(value){
		case "reset": {
			await resetGame();
			refresh();
		} break;
	}
}

function playerBarSubmit(value) {
}

function companyBarSubmit(value) {
}

async function refresh(){
	await ui.refresh();
	ui.document.elements.companyBar.on('submit', companyBarSubmit);
	ui.document.elements.playerBar.on('submit', playerBarSubmit);
  ui.document.elements.gameMenu.on('submit', gameMenuSubmit);

	if(db.main.phase == "invest"){
		ui.document.elements.investMenu.on('submit', investMenuSubmit);
		if(ui.document.elements.confirm) ui.document.elements.confirm.on('submit', confirmSecondInvestSubmit);
	}
}

async function resetGame(){
	log.append("--- RESET BEGIN!---");

	await db.deleteAll();

	let prices = {
		"spaceyard": 2,
		"factory": 5,
		"luxury": 4,
		"investor": 0,
		"officer": 1,
		"executive": 1,
		"influence": 2
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
    "money": 10,
		"lastAction": "",
		"influence": 20
	}

	let tab = await db.createTable("players");
	await tab.update();

	let row = await tab.createRow(player1);
	await row.update();

	let player2 = {
    "id": 2,
    "money": 10,
		"influence": 0
	}

	row = await tab.createRow(player2);
	await row.update();

	let company = {
    "money": 5,
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
		]
	}

	obj = await db.createObject("company", company);
	await obj.update();

	tab = await db.createTable("offices");
	await tab.update();

	let office = {
		"name": "chairman",
		"personId": 0,
		"hasTreasury": false,
		"hasExecutives": false
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"name": "tradeDirector",
		"personId": 0,
		"hasTreasury": true,
		"money": 3,
		"hasExecutives": false
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"name": "shippingManager",
		"personId": 0,
		"hasTreasury": true,
		"money": 3,
		"hasExecutives": false
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"name": "militaryAffairs",
		"personId": 0,
		"hasTreasury": false,
		"hasExecutives": false,
		"ensigns": []
	}

	row = await tab.createRow(office);
	await row.update();

	tab = await db.createTable("spaceyards");
	await tab.update();

	tab = await db.createTable("systems");
	await tab.update();

	tab = await db.createTable("persons");
	await tab.update();

	tab = await db.createTable("planets");
	await tab.update();

	for(let i = 0; i < 3; i++){
		let system = {
			"name": "System " + (i + 1)
		}

		row = await db.systems.createRow(system);
		await row.update();

		office = {
			"name": "systemPresident",
			"personId": 0,
			"hasTreasury": true,
			"hasExecutives": true,
			"systemId": system.id,
			"money": 3,
			"executives": []
		}

		row = await db.offices.createRow(office);
		await row.update();

		let order = 1;
		for(let j = 0; j < 3 + system.id; j++){
			let planet = {
				"name": `${system.id}.${order}`,
				"systemId": system.id,
				"order": order++
			}

			row = await db.planets.createRow(planet);
			await row.update();
		}
	}

	log.append("--- RESET DONE!---");
}

async function buySpaceyard(playerId){
	let player = db.players.get(playerId);
	if(player.money < db.prices.spaceyard) return undefined;

  let yard = {
    "playerId": playerId,
		"spaceshipName": helpers.toCapitalCase(faker.word.words({ count: { min: 1, max: 2 }})),		
    "spaceshipLocation": 'docking'
  }

	let obj = await db.spaceyards.createRow(yard);
	await obj.update();

	player.money -= db.prices.spaceyard;

	return obj;
}

async function hireOfficer(playerId){
	let player = db.players.get(playerId);

	if(player.influence < db.prices.officer) return undefined;

	const office = db.offices.find(o => o.name == "militaryAffairs");
	const p = await hirePerson(playerId, db.prices.officer);

	office.ensigns.push(p.id);
	await office.update();
}

async function hireShareholder(playerId, share){
	let player = db.players.get(playerId);

	let sI = parseInt(share.substring(5));
	if(player.influence < db.company.shares[sI].price) return undefined;

	const p = await hirePerson(playerId, db.company.shares[sI].price);

	db.company.shares[sI].personId = p.id;
	await db.company.update();

	delete player.buyingShare;
}

async function hireExecutive(playerId, executive){
	let player = db.players.get(playerId);

	if(player.influence < db.prices.executive) return undefined;

	const systemId = parseInt(executive.substring(9));
	const office = db.offices.find(o => o.systemId == systemId);
	const p = await hirePerson(playerId, db.prices.executive);

	office.executives.push(p.id);
	await office.update();

	delete player.hiringExecutive;
}

async function hirePerson(playerId, influence){
	let player = db.players.get(playerId);

  let person = {
		"name": faker.person.fullName(),
    "influence": {}
  }
	person.influence[playerId] = influence;

	let obj = await db.persons.createRow(person);
	await obj.update();

	player.influence -= influence;

	return obj;
}
