const db = require('./db');
const log = require('./log');
const termkit = require('terminal-kit');

let ui = {
  init: (term) => {
    ui.term = term;
  },

  refresh: async () => {
    if(ui.document) ui.document.destroy();

    ui.document = ui.term.createDocument({ palette: new termkit.Palette() });
    
    let player = db.players.get(1);

    let layout = [
    {
      id: 'companyRow',
      columns: [
        { id: 'company' }
      ]
    },
    {
      id: 'systemRow',
      height: 9,
      columns: []
    },
    {
      id: 'playerRow',
      heightPercent: 30,
      columns: [
        { id: 'player' }
      ]
    },
    {
      id: 'menuRow',
      height: 3,
      columns: [
        { id: 'menu' }
      ]
    },
    {
      id: 'logRow',
      columns: [
        { id: 'log' }
      ]
    }];

    db.systems.forEach((system) => {
      layout[1].columns.push({ id: 'systemColumn' + system.id });
    });

    new termkit.Layout({
      parent: ui.document,
      boxChars: 'single',
      layout: {
        id: 'main',
        y: 0,
        widthPercent: 100,
        heightPercent: 100,
        rows: layout
      }
    });

    db.systems.forEach((system) => {
      let w = ui.document.elements["systemColumn" + system.id].outputWidth;

      let cmItems = [
        {
          content: `^[bgWhite] ${system.name}`.padEnd(w + 10, ' '),
          disabled: true,
          markup: true
        }
      ]

      db.planets.filter(o => o.systemId == system.id).forEach((p) => {
        cmItems.push({
          content: ` ${p.name} `.padEnd(10, ' '),
          markup: true
        });
      });

      new termkit.ColumnMenu({
        parent: ui.document.elements["systemColumn" + system.id],
        id: "system" + system.id,
        x: 0,
        y: 0,
        autoWidth: true,
        buttonFocusAttr: { bgColor: 'green', color: 'blue', bold: true },
        buttonBlurAttr: { bgColor: 'black', color: 'white', bold: false },
        items: cmItems
      });
    });

    await log.createTextBox(ui.document.elements.log);

    new termkit.RowMenu({
      parent: ui.document.elements.company,
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
          content: ` Money: ^[black]${db.company.money} `,
          disabled: true,
          markup: true
        }
      ]
    });

    new termkit.RowMenu({
      parent: ui.document.elements.player,
      id: "playerBar",
      x: 0,
      y: 0,
      separator: '|',
      justify: false,
      items: [
        {
          content: ` ^[black]${db.main.turn} `,
          disabled: true,
          markup: true
        },
        {
          content: ` ^[black]${db.main.phase} `,
          disabled: true,
          markup: true
        },
        {
          content: ` Money: ^[black]${player.money} `,
          disabled: true,
          markup: true
        },
        {
          content: ` Yards: ^[black]${db.spaceyards.count(o => o.playerId == 1)} `,
          disabled: true,
          markup: true
        }
      ]
    });

    if(db.main.phase == "invest"){
      let cheapestShare = db.company.shares.find(o => o.playerId == 0);

      let items = [
      {
        content: '^[bgWhite]     Choose action     ',
        disabled: true,
        markup: true
      },
      {
        content: `  ${player.lastAction == "spaceyard" ? "^+" : ""}Buy Spaceyard ${player.lastAction == "spaceyard" ? "x2" : "  "} ${db.prices.spaceyard}C  `,
        value: 'spaceyard',
        markup: true,
        disabled: player.money < db.prices.spaceyard || player.confirm || player.buyingShare
      },
      {
        content: `  ${player.lastAction == "factory" ? "^+" : ""}Buy Factory ${player.lastAction == "factory" ? "x2" : "  "}   ${db.prices.factory}C  `,
        value: 'factory',
        markup: true,
        disabled: player.money < db.prices.factory || player.confirm || player.buyingShare
      },
      {
        content: `  ${player.lastAction == "luxury" ? "^+" : ""}Buy Luxury ${player.lastAction == "luxury" ? "x2" : "  "}    ${db.prices.luxury}C  `,
        value: 'luxury',
        markup: true,
        disabled: player.money < db.prices.luxury || player.confirm || player.buyingShare
      },
      {
        content: `  ${player.lastAction == "share" ? "^+" : ""}Buy Share ${player.lastAction == "share" ? "x2" : "  "}        ►`,
        value: 'share',
        markup: true,
        disabled: cheapestShare === undefined || player.money < cheapestShare.price || player.confirm,
        items: []
      },
      {
        content: `  ${player.lastAction == "officer" ? "^+" : ""}Hire Officer ${player.lastAction == "officer" ? "x2" : "  "}  ${db.prices.officer}C  `,
        value: 'officer',
        markup: true,
        disabled: player.money < db.prices.officer || player.confirm || player.buyingShare
      },
      {
        content: `  ${player.lastAction == "executive" ? "^+" : ""}Hire Executive ${player.lastAction == "executive" ? "x2" : "  "}${db.prices.executive}C ►`,
        value: 'executive',
        markup: true,
        disabled: player.money < db.prices.executive || player.confirm || player.buyingShare
      }]

      db.company.shares.forEach((share, idx) => {
        items[4].items.push({
          content: `  ${share.price}C  `,
          value: 'share' + idx,
          markup: true,
          disabled: player.money < share.price || share.playerId != 0 || player.confirm
        });
      });

      new termkit.ColumnMenu({
        parent: ui.document.elements.player,
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
          focusOnOpen: false
        },		
        items: items
      });

      if(player.confirm){
        let posY = ui.document.elements.investMenu.outputY + ui.document.elements.investMenu.outputHeight;
        await ui.confirm("Perform action again?", ui.document.elements.investMenu.outputX, posY);
      }      
    }

    new termkit.RowMenu({
      parent: ui.document.elements.menu,
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
  },

  confirm: async (prompt, x, y) => {
	  new termkit.InlineMenu({
      parent: ui.document.elements.player,
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
        }
      ]
    });
  }
}

exports = module.exports = ui;