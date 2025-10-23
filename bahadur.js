const db = require('./db');
const log = require('./log');
const termkit = require('terminal-kit');
const ui = require('./ui');
const setup = require('./setup');
const game = require('./game');

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
		init();
		term.hideCursor(true);
	});
})()

async function init(){
	await db.init('./data', (msg) => {
		log.append(msg);
	});

	if(db.count == 0) await setup.newGame();

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

	delete player.buyingShare;
  delete player.hiringExecutive;	

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
	await player.update();

	await game.nextPhase();
	
	refresh();
}

async function investAction(value){
	if(value.startsWith("share")){
		const shareId = parseInt(value.substring(5));
		await game.hireShareholder(1, shareId, db.company.shares[shareId].price);
		ui.document.elements.investMenu.closeSubmenu();
	}else	if(value.startsWith("executive")){
		await game.hireExecutive(1, parseInt(value.substring(9)), db.prices.executive);
		ui.document.elements.investMenu.closeSubmenu();
	}else{
		switch(value){
			case "spaceyard": await game.buySpaceyard(1, 0, db.prices.spaceyard); break;
			case "officer": await game.hireOfficer(1, db.prices.officer); break;
			case "factory": await game.buyFactory(1, db.prices.factory); break;
			case "luxury": await game.buyLuxury(1, db.prices.luxury); break;
		}
	}
}

async function gameMenuSubmit(value) {
	switch(value){
		case "reset": {
			await setup.newGame();
			refresh();
		} break;
	}
}

function playerBarSubmit(value) {
}

function companyBarSubmit(value) {
	if(value == "companyMode"){
		if(ui.companyMode == "offices")
			ui.companyMode = "shareholders";
		else
			ui.companyMode = "offices";
		refresh();
	}
	if(value == "systemMode"){
		if(ui.systemMode == "office")
			ui.systemMode = "ships";
		else
			ui.systemMode = "office";
		refresh();
	}
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