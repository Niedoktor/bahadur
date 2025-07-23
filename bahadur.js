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

		term.on('terminal', function(name, data) {
			switch (name) {
				//case 'CURSOR_LOCATION': x = data.x; y = data.y; break;
				case 'SCREEN_SIZE' : refresh(); break;
			}
		});

		term.on('mouse', function(name, data) {
			switch (name) {
			}
			//console.log( "'mouse' event:" , name , data ) ;
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

	let cheapestShare = db.company.shares.find(o => o.playerId == 0);
	
	if((player.lastAction == value && player.money >= db.prices[value]) ||
		(player.lastAction == "share" && value.startsWith("share") && cheapestShare !== undefined && player.money >= cheapestShare.price)){
		player.confirm = true;
	}

	if(value.startsWith("share")){
		player.lastAction = "share";
	}else{
		player.lastAction = value;
	}
	player.update();
	
	refresh();
}

async function investAction(value){
	if(value.startsWith("share")){
		await buyShare(1, value);
		ui.document.elements.investMenu.closeSubmenu();
	}else{
		switch(value){
			case "spaceyard": await buySpaceyard(1); break;
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

// function menuRedraw(menu){
// 	document.elements[menu].clear();
// 	document.elements[menu].pageItemsDef = [];
// 	document.elements[menu].initChildren();
// 	document.elements[menu].draw();
// }

// function menuButtonContent(menu, idx, content){
// 	document.elements[menu].itemsDef[idx].content = content;
// }

// function menuButtonDisabled(menu, idx, disabled){
// 	document.elements[menu].itemsDef[idx].disabled = disabled;
// }

async function refresh(){
	await ui.refresh();
	ui.document.elements.companyBar.on('submit', companyBarSubmit);
	ui.document.elements.playerBar.on('submit', playerBarSubmit);
  ui.document.elements.gameMenu.on('submit', gameMenuSubmit);

	if(db.main.phase == "invest"){
		ui.document.elements.investMenu.on('submit', investMenuSubmit);
		if(ui.document.elements.confirm) ui.document.elements.confirm.on('submit', confirmSecondInvestSubmit);
	}

// 	let player = db.players.get(1);

// 	menuButtonContent("playerBar", 0, ` ^[black]${db.main.turn} `);
// 	menuButtonContent("playerBar", 1, ` ^[black]${db.main.phase} `);
// 	menuButtonContent("playerBar", 2, ` Money: ^[black]${player.money} `);
// 	menuButtonContent("playerBar", 3, ` Yards: ^[black]${db.spaceyards.count(o => o.playerId == 1)} `);

// 	menuRedraw("playerBar");

// 	menuButtonContent("companyBar", 1, ` Money: ^[black]${db.company.money} `);

// 	menuRedraw("companyBar");

// 	if(db.main.phase == "invest"){

		

// 		menuRedraw("investMenu");
// 	}else{
// 		document.elements.investMenu.hide();
// 	}
}

async function resetGame(){
	log.append("--- RESET BEGIN!---");

	await db.deleteAll();

	let prices = {
		"spaceyard": 2,
		"factory": 5,
		"luxury": 4,
		"officer": 0,
		"executive": 0
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
		"lastAction": ""
	}

	let tab = await db.createTable("players");
	await tab.update();

	let row = await tab.createRow(player1);
	await row.update();

	let player2 = {
    "id": 2,
    "money": 10
	}

	row = await tab.createRow(player2);
	await row.update();

	let company = {
    "money": 5,
		"shares": [
			{
				"price": 2,
				"playerId": 0
			},
			{
				"price": 3,
				"playerId": 0
			},
			{
				"price": 3,
				"playerId": 0
			},
			{
				"price": 4,
				"playerId": 0
			},
			{
				"price": 5,
				"playerId": 0
			},
		]
	}

	obj = await db.createObject("company", company);
	await obj.update();

	tab = await db.createTable("offices");
	await tab.update();

	let office = {
		"name": "chairman",
		"playerId": 0,
		"hasTreasury": false,
		"hasExecutives": false
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"name": "tradeDirector",
		"playerId": 0,
		"hasTreasury": true,
		"money": 3,
		"hasExecutives": false
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"name": "shippingManager",
		"playerId": 0,
		"hasTreasury": true,
		"money": 3,
		"hasExecutives": false
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"name": "militaryAffairs",
		"playerId": 0,
		"hasTreasury": false,
		"hasExecutives": false
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"name": "systemPresident",
		"playerId": 0,
		"hasTreasury": true,
		"hasExecutives": true,
		"systemId": 1
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"name": "systemPresident",
		"playerId": 0,
		"hasTreasury": true,
		"hasExecutives": true,
		"systemId": 2
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"name": "systemPresident",
		"playerId": 0,
		"hasTreasury": true,
		"hasExecutives": true,
		"systemId": 3
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

		let order = 1;
		for(let j = 0; j < 3 + system.id; j++){
			let planet = {
				"playerId": 0,
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
	let res = true;

	let player = db.players.get(playerId);
	if(player.money < db.prices.spaceyard) return false;

  let yard = {
    "playerId": playerId,
		"spaceshipName": helpers.toCapitalCase(faker.word.words({ count: { min: 1, max: 2 }})),		
    "spaceshipLocation": 'docking'
  }

	let obj = await db.spaceyards.createRow(yard);
	await obj.update();

	player.money -= db.prices.spaceyard;

	return res;
}

async function buyShare(playerId, share){
	let player = db.players.get(playerId);

	let sI = parseInt(share.substring(5));
	db.company.shares[sI].playerId = 1;
	db.company.update();

	player.money -= db.company.shares[sI].price;
	delete player.buyingShare;
}