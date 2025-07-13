const db = require('./db');
const log = require('./log');
const playerHelper = require('./playerHelper');
const termkit = require('terminal-kit');

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
	
	let layout = new termkit.Layout({
		parent: document,
		boxChars: 'single',
		layout: {
			id: 'main' ,
			y: 0,
			widthPercent: 100 ,
			heightPercent: 100 ,
			rows: [
				{
					id: 'row1',
					heightPercent: 80,
					columns: [
						{ id: 'game', widthPercent: 100 }
					]
				},
				{
					id: 'row2',
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

	//await resetGame();

	await playerHelper.init(db, (msg) => {
		log.print(msg);
	});

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

	topBar.on('submit', menuButtonClicked);

	let investMenu = new termkit.ColumnMenu({
		parent: document.elements.game,
		x: 2,
		y: 2,
		items: [
			{
				content: ' Spaceyard  2C ',
				value: 'spaceyard'
			},
			{
				content: ' Factory    5C ',
				value: 'factory'
			},
			{
				content: ' Luxury     4C ',
				value: 'luxury'
			},
			{
				content: ' Share      2C ',
				value: 'share'
			},
			{
				content: ' Officer    0C ',
				value: 'officer'
			},
			{
				content: ' Manager    0C ',
				value: 'manager'
			}
		]
	});

	investMenu.on('submit', investMenuSubmit);

	refreshUI();

	// new termkit.Text({
	// 	parent: document.elements.game,
	// 	id: "text1",
	// 	x: 1,
	// 	y: 5,
	// 	attr: { color: 'blue' }
	// });	
}

function investMenuSubmit(value) {
	switch(value){
		case "spaceyard": buySpaceyard(1); break;
	}
}

function menuButtonClicked(buttonValue) {
//	document.elements.text1.setContent(buttonValue);
}

function topBarRedraw(){
	document.elements.topBar.clear();
	document.elements.topBar.pageItemsDef = [];
	document.elements.topBar.initChildren();
	document.elements.topBar.draw();
}

function topBarButtonUpdate(idx, content){
	document.elements.topBar.itemsDef[idx].content = content;
}

function refreshUI(){
	let player = playerHelper.getPlayer(1);

	topBarButtonUpdate(0, ` ^[black]${db.main.turn} `);
	topBarButtonUpdate(1, ` ^[black]${db.main.phase} `);
	topBarButtonUpdate(2, ` Money: ^[black]${player.money} `);
	topBarButtonUpdate(3, ` Yards: ^[black]${playerHelper.yardsCount(1)} `);

	topBarRedraw();
}

async function resetGame(){
	await db.deleteAll();

	let main = {
    "turn": 1,
    "phase": "invest"
	}

	let obj = await db.createObject("main", main);
	await obj.update();

	let player1 = {
    "id": 1,
    "money": 10
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
	if(player.money < 2) return false;

  let yard = {
		"id": db.indices.hasOwnProperty("spaceyards") ? db.indices.spaceyards + 2 : 1,
    "ownerId": playerId,
    "occupied": true
  }

	let obj = await db.createRow("spaceyards", yard);
	await obj.update();

	return res;
}