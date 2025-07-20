const db = require('./db');
const log = require('./log');
const termkit = require('terminal-kit');
const { faker } = require('@faker-js/faker');
const helpers = require('./helpers');

let term;
let document;

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
				//case 'SCREEN_SIZE' : term('\n').eraseLineAfter.blue("(%s,%s)\n", term.width, term.height); break;
			}
		});

		term.on('mouse', function(name, data) {
			switch (name) {
			}
			//console.log( "'mouse' event:" , name , data ) ;
		});

		term.clear();
		init();
		term.hideCursor(true);
	});
})()

async function init(){

	document = term.createDocument({ palette: new termkit.Palette() });
	
	new termkit.Layout({
		parent: document,
		boxChars: 'single',
		layout: {
			id: 'main',
			y: 0,
			widthPercent: 100,
			heightPercent: 100,
			rows: [
				{
					id: 'row1',
					heightPercent: 40,
					columns: [
						{ id: 'company' }
					]
				},
				{
					id: 'row2',
					heightPercent: 40,
					columns: [
						{ id: 'player' }
					]
				},
				{
					id: 'row3',
					height: 3,
					columns: [
						{ id: 'menu' }
					]
				},
				{
					id: 'row4',
					columns: [
						{ id: 'log' }
					]
				}
			]
		}
	});

	await log.init(document.elements.log);

	await db.init('./data', (msg) => {
		log.print(msg);
	});

	let companyBar = new termkit.RowMenu({
		parent: document.elements.company,
		id: "companyBar",
		x: 0,
		y: 0,
		separator: '|',
		justify: false,
		items: [
			{
				content: ' ^[black]COMPANY ',
				disabled: true,
				markup: true
			},
			{
				content: ' Money ',
				disabled: true,
				markup: true
			}
		]
	});

	companyBar.on('submit', companyBarSubmit);

	let playerBar = new termkit.RowMenu({
		parent: document.elements.player,
		id: "playerBar",
		x: 0,
		y: 0,
		separator: '|',
		justify: false,
		items: [
			{
				content: ' Turn ',
				disabled: true,
				markup: true
			},
			{
				content: ' Phase ',
				disabled: true,
				markup: true
			},
			{
				content: ' Money ',
				disabled: true,
				markup: true
			},
			{
				content: ' Yards ',
				disabled: true,
				markup: true
			}
		]
	});

	playerBar.on('submit', playerBarSubmit);

	let investMenu = new termkit.ColumnMenu({
		parent: document.elements.player,
		id: "investMenu",
		x: 2,
		y: 2,
		buttonFocusAttr: { bgColor: 'green', color: 'blue', bold: true },
		buttonBlurAttr: { bgColor: 'black', color: 'white', bold: false },
		submenu: {
			disposition: 'byside',
			hideParent: false,
			openOn: 'parentFocus',
			closeOn: 'childSubmit',
			focusOnOpen: false,
			//*/
		},		
		items: [
			{
				content: '^[bgWhite]     Choose action     ',
				disabled: true,
				markup: true
			},
			{
				content: '',
				value: 'spaceyard',
				markup: true
			},
			{
				content: '',
				value: 'factory',
				markup: true
			},
			{
				content: '',
				value: 'luxury',
				markup: true
			},
			{
				content: '',
				value: 'share',
				markup: true,
				items: [
					{
						content: '',
						value: 'share0',
						markup: true
					},
					{
						content: '',
						value: 'share1',
						markup: true
					},
					{
						content: '',
						value: 'share2',
						markup: true
					},
					{
						content: '',
						value: 'share3',
						markup: true
					},
					{
						content: '',
						value: 'share4',
						markup: true
					}
				]
			},
			{
				content: '',
				value: 'officer',
				markup: true
			},
			{
				content: '',
				value: 'executive',
				markup: true
			}
		]
	});

	investMenu.on('submit', investMenuSubmit);

	let gameMenu = new termkit.RowMenu({
		parent: document.elements.menu,
		id: "gameMenu",
		x: 0,
		y: 0,
		autoWidth: true,
		separator: '|',
		justify: false,		
		items: [
			{
				content: ' RESET ',
				value: 'reset'
			}
		]
	});

	gameMenu.on('submit', gameMenuSubmit);

	//await resetGame();

	refreshUI();
}

async function Confirm(prompt, x, y, callback){
	let confirm = new termkit.InlineMenu({
		parent: document.elements.player,
		id: "confirm",
		x: x,
		y: y,
		prompt: {
			textAttr: { bgColor: 'blue', color: 'white' },
			content: " " + prompt + " ",
			contentHasMarkup: true
		},
		width: prompt.length + 12,
		items: [
			{
				content: ' Yes ',
				value: 'yes'
			},
			{
				content: ' No ',
				value: 'no'
			},
			// {
			// 	content: 'Abort',
			// 	value: 'abort'
			// }
		]
	});

	confirm.on('submit', callback);
}

async function confirmSecondInvestSubmit(value) {
	let player = db.players.get(1);

	delete player.confirm;

	if(value == "yes"){
		if(player.lastAction.startsWith("share")){
			player.buyingShare = true;
			player.update();
		}else{
			await investAction(player.lastAction);
		}
	}else{
		player.update();
	}

	document.elements.confirm.destroy();

	refreshUI();
}

async function investMenuSubmit(value) {
	let player = db.players.get(1);

	await investAction(value);

	let cheapestShare = db.company.shares.find(o => o.playerId == 0);
	
	if((player.lastAction == value && player.money >= db.prices[value]) ||
		(player.lastAction == "share" && value.startsWith("share") && cheapestShare !== undefined && player.money >= cheapestShare.price)){
		player.confirm = true;
	}

	player.update();
	
	refreshUI();
}

async function investAction(value){
	let player = db.players.get(1);

	if(value.startsWith("share")){
		await buyShare(1, value);
		document.elements.investMenu.closeSubmenu();
	}else{
		switch(value){
			case "spaceyard": await buySpaceyard(1); break;
		}
		player.lastAction = value;
	}
}

async function gameMenuSubmit(value) {
	switch(value){
		case "reset": {
			await resetGame();
			refreshUI();
		} break;
	}
}

function playerBarSubmit(value) {
}

function companyBarSubmit(value) {
}

function menuRedraw(menu){
	document.elements[menu].clear();
	document.elements[menu].pageItemsDef = [];
	document.elements[menu].initChildren();
	document.elements[menu].draw();
}

function menuButtonContent(menu, idx, content){
	document.elements[menu].itemsDef[idx].content = content;
}

function menuButtonDisabled(menu, idx, disabled){
	document.elements[menu].itemsDef[idx].disabled = disabled;
}

async function refreshUI(){
	let player = db.players.get(1);

	menuButtonContent("playerBar", 0, ` ^[black]${db.main.turn} `);
	menuButtonContent("playerBar", 1, ` ^[black]${db.main.phase} `);
	menuButtonContent("playerBar", 2, ` Money: ^[black]${player.money} `);
	menuButtonContent("playerBar", 3, ` Yards: ^[black]${db.spaceyards.count(o => o.playerId == 1)} `);

	menuRedraw("playerBar");

	menuButtonContent("companyBar", 1, ` Money: ^[black]${db.company.money} `);

	menuRedraw("companyBar");

	if(db.main.phase == "invest"){
		document.elements.investMenu.show();

		menuButtonContent("investMenu", 1, `  ${player.lastAction == "spaceyard" ? "^+" : ""}Buy Spaceyard ${player.lastAction == "spaceyard" ? "x2" : "  "} ${db.prices.spaceyard}C  `);
		menuButtonContent("investMenu", 2, `  ${player.lastAction == "factory" ? "^+" : ""}Buy Factory ${player.lastAction == "factory" ? "x2" : "  "}   ${db.prices.factory}C  `);
		menuButtonContent("investMenu", 3, `  ${player.lastAction == "luxury" ? "^+" : ""}Buy Luxury ${player.lastAction == "luxury" ? "x2" : "  "}    ${db.prices.luxury}C  `);
		menuButtonContent("investMenu", 4, `  ${player.lastAction == "share" ? "^+" : ""}Buy Share ${player.lastAction == "share" ? "x2" : "  "}        ►`);
		menuButtonContent("investMenu", 5, `  ${player.lastAction == "officer" ? "^+" : ""}Hire Officer ${player.lastAction == "officer" ? "x2" : "  "}  ${db.prices.officer}C  `);
		menuButtonContent("investMenu", 6, `  ${player.lastAction == "executive" ? "^+" : ""}Hire Executive ${player.lastAction == "executive" ? "x2" : "  "}${db.prices.executive}C ►`);

		let cheapestShare = db.company.shares.find(o => o.playerId == 0);

		menuButtonDisabled("investMenu", 1, player.money < db.prices.spaceyard || player.confirm || player.buyingShare);
		menuButtonDisabled("investMenu", 2, player.money < db.prices.factory || player.confirm || player.buyingShare);
		menuButtonDisabled("investMenu", 3, player.money < db.prices.luxury || player.confirm || player.buyingShare);
		menuButtonDisabled("investMenu", 4, cheapestShare === undefined || player.money < cheapestShare.price || player.confirm);
		menuButtonDisabled("investMenu", 5, player.money < db.prices.officer || player.confirm || player.buyingShare);
		menuButtonDisabled("investMenu", 6, player.money < db.prices.executive || player.confirm || player.buyingShare);

		for(let i = 0; i < db.company.shares.length; i++){
			document.elements.investMenu.itemsDef[4].items[i].content = `  ${db.company.shares[i].price}C  `;
			document.elements.investMenu.itemsDef[4].items[i].disabled = player.money < db.company.shares[i].price || db.company.shares[i].playerId != 0 || player.confirm;
		}
		
		if(player.confirm){
			let posY = document.elements.investMenu.outputY + document.elements.investMenu.outputHeight;
			await Confirm("Perform action again?", document.elements.investMenu.outputX, posY, confirmSecondInvestSubmit);
		}

		menuRedraw("investMenu");
	}else{
		document.elements.investMenu.hide();
	}
}

async function resetGame(){
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
		"id": db.indices.offices + 2,
		"name": "chairman",
		"playerId": 0,
		"hasTreasury": false,
		"hasExecutives": false
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"id": db.indices.offices + 2,
		"name": "tradeDirector",
		"playerId": 0,
		"hasTreasury": true,
		"money": 3,
		"hasExecutives": false
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"id": db.indices.offices + 2,
		"name": "shippingManager",
		"playerId": 0,
		"hasTreasury": true,
		"money": 3,
		"hasExecutives": false
	}

	row = await tab.createRow(office);
	await row.update();

	office = {
		"id": db.indices.offices + 2,
		"name": "militaryAffairs",
		"playerId": 0,
		"hasTreasury": false,
		"hasExecutives": false
	}

	row = await tab.createRow(office);
	await row.update();

	tab = await db.createTable("spaceyards");
	await tab.update();
}

async function buySpaceyard(playerId){
	let res = true;

	let player = db.players.get(playerId);
	if(player.money < db.prices.spaceyard) return false;

  let yard = {
		"id": db.indices.spaceyards + 2,
    "ownerId": playerId,
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

	player.lastAction = "share";
	let sI = parseInt(share.substring(5));
	db.company.shares[sI].playerId = 1;
	db.company.update();

	player.money -= db.company.shares[sI].price;
	delete player.buyingShare;
}