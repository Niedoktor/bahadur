const db = require('./db');
const log = require('./log');
const playerHelper = require('./playerHelper');
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
					heightPercent: 80,
					columns: [
						{ id: 'game' }
					]
				},
				{
					id: 'row2',
					height: 3,
					columns: [
						{ id: 'menu' }
					]
				},
				{
					id: 'row3',
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

	await playerHelper.init(db);

	let topBar = new termkit.RowMenu({
		parent: document.elements.game,
		id: "topBar",
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

	topBar.on('submit', topBarSubmit);

	let investMenu = new termkit.ColumnMenu({
		parent: document.elements.game,
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
				value: 'manager',
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

	refreshUI();
}

async function Confirm(prompt, x, y){
	let confirm = new termkit.InlineMenu({
		parent: document.elements.game,
		id: "confirm",
		x: x,
		y: y,
		prompt: {
			textAttr: { bgColor: 'blue', color: 'white' },
			content: prompt,
			contentHasMarkup: true
		},
		width: 30,
		items: [
			{
				content: 'Yes',
				value: 'yes'
			},
			{
				content: 'No',
				value: 'no'
			},
			{
				content: 'Abort',
				value: 'abort'
			}
		]
	});

	confirm.on('submit', confirmSubmit);
}

async function confirmSubmit(value) {
	switch(value){
	}
	document.elements.confirm.destroy();
}

async function investMenuSubmit(value) {
	let player = playerHelper.getPlayer(1);

	if(player.lastAction == value && player.money >= db.prices[value] * 2){
		let pos = await term.getCursorLocation();
		document.elements.investMenu.disabled = true;
		document.elements.investMenu.redraw();
		await Confirm("Perform an action twice?", 2, pos.y);
		return;
	}
	
	switch(value){
		case "spaceyard": await buySpaceyard(1); break;
	}
	refreshUI();
}

async function gameMenuSubmit(value) {
	switch(value){
		case "reset": {
			await resetGame();
			refreshUI();
		} break;
	}
}

function topBarSubmit(value) {
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

function refreshUI(){
	let player = playerHelper.getPlayer(1);

	menuButtonContent("topBar", 0, ` ^[black]${db.main.turn} `);
	menuButtonContent("topBar", 1, ` ^[black]${db.main.phase} `);
	menuButtonContent("topBar", 2, ` Money: ^[black]${player.money} `);
	menuButtonContent("topBar", 3, ` Yards: ^[black]${playerHelper.spaceyardsCount(1)} `);

	menuRedraw("topBar");

	if(db.main.phase == "invest"){
		document.elements.investMenu.show();

		menuButtonContent("investMenu", 1, `  ${player.lastAction == "spaceyard" ? "^+" : ""}Buy Spaceyard ${player.lastAction == "spaceyard" ? "x2" : "  "} ${db.prices.spaceyard}C  `);
		menuButtonContent("investMenu", 2, `  ${player.lastAction == "factory" ? "^+" : ""}Buy Factory ${player.lastAction == "factory" ? "x2" : "  "}   ${db.prices.factory}C  `);
		menuButtonContent("investMenu", 3, `  ${player.lastAction == "luxury" ? "^+" : ""}Buy Luxury ${player.lastAction == "luxury" ? "x2" : "  "}    ${db.prices.luxury}C  `);
		menuButtonContent("investMenu", 4, `  ${player.lastAction == "share" ? "^+" : ""}Buy Share ${player.lastAction == "share" ? "x2" : "  "}        ►`);
		menuButtonContent("investMenu", 5, `  ${player.lastAction == "officer" ? "^+" : ""}Hire Officer ${player.lastAction == "officer" ? "x2" : "  "}  ${db.prices.officer}C  `);
		menuButtonContent("investMenu", 6, `  ${player.lastAction == "manager" ? "^+" : ""}Hire Manager ${player.lastAction == "manager" ? "x2" : "  "}  ${db.prices.manager}C ►`);

		menuButtonDisabled("investMenu", 1, player.money < db.prices.spaceyard);
		menuButtonDisabled("investMenu", 2, player.money < db.prices.factory);
		menuButtonDisabled("investMenu", 3, player.money < db.prices.luxury);
		menuButtonDisabled("investMenu", 5, player.money < db.prices.officer);
		menuButtonDisabled("investMenu", 6, player.money < db.prices.manager);

		document.elements.investMenu.itemsDef[4].items[0].content = `  ${db.prices.share[0]}C  `;
		document.elements.investMenu.itemsDef[4].items[1].content = `  ${db.prices.share[1]}C  `;
		document.elements.investMenu.itemsDef[4].items[2].content = `  ${db.prices.share[2]}C  `;
		document.elements.investMenu.itemsDef[4].items[3].content = `  ${db.prices.share[3]}C  `;

		document.elements.investMenu.itemsDef[4].items[0].disabled = player.money < db.prices.share[0];
		document.elements.investMenu.itemsDef[4].items[1].disabled = player.money < db.prices.share[1];
		document.elements.investMenu.itemsDef[4].items[2].disabled = player.money < db.prices.share[2];
		document.elements.investMenu.itemsDef[4].items[3].disabled = player.money < db.prices.share[3];

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
		"manager": 0,
		"share": [
			2, 3, 4, 5
		]
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

	obj = await db.createRow("players", player1);
	await obj.update();

	let player2 = {
    "id": 2,
    "money": 10
	}

	obj = await db.createRow("players", player2);
	await obj.update();
}

async function buySpaceyard(playerId){
	let res = true;

	let player = playerHelper.getPlayer(playerId);
	if(player.money < db.prices.spaceyard) return false;

  let yard = {
		"id": db.indices.hasOwnProperty("spaceyards") ? db.indices.spaceyards + 2 : 1,
    "ownerId": playerId,
		"spaceshipName": helpers.toCapitalCase(faker.word.words({ count: { min: 1, max: 2 }})),		
    "spaceshipLocation": 'docking'
  }

	let obj = await db.createRow("spaceyards", yard);
	await obj.update();

	player.money -= db.prices.spaceyard;
	player.lastAction = "spaceyard";
	await player.update();

	return res;
}