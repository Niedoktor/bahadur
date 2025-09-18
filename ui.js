const termkit = require('terminal-kit');
const helpers = require('./helpers');
const db = require('./db');
const log = require('./log');
const getPerson = require('./getPerson');
const getOffice = require('./getOffice');
const getPlayer = require('./getPlayer');
const { SystemModule } = require('@faker-js/faker');

const ui = {
  init: (term) => {
    ui.term = term;
  },

  refresh: async () => {
    if(ui.document) ui.document.destroy();

    ui.document = ui.term.createDocument({ palette: new termkit.Palette() });
    
    let player = getPlayer(1);

    let layout = [
    {
      id: 'companyRow',
      height: 3,
      columns: [
        { id: 'company' }
      ]
    },
    {
      id: 'officeRow',
      height: 10,
      columns: [
        { id: 'office1' },
        { id: 'office2' }
      ]
    },
    {
      id: 'systemRow',
      columns: []
    },
    {
      id: 'playerRow',
      height: 14,
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
      height: 7,
      columns: [
        { id: 'log' }
      ]
    }];

    await db.systems.forEach((system) => {
      layout[2].columns.push({ id: 'systemColumn' + system.id });
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

    await db.systems.forEach((system) => {
      const element = ui.document.elements["systemColumn" + system.id];
      const w = element.outputWidth;
      const office = getOffice("systemPresident" + system.id);

      ui.drawOffice(office, element, 0, 7);

      new termkit.Text({
        parent: element,
        content: helpers.centerText("EXECUTIVES", w),
        contentHasMarkup: true,
        x: 0,
        y: 9,
        autoWidth: true,
        attr: { bgColor: "gray", color: 'black', bold: true }
      });

      let y = 10;
      db.executives.filter(o => o.systemId == system.id).forEach(exe => {
        ui.drawPerson(getPerson(exe.personId), element, 0, y++);
      })

      new termkit.Text({
        parent: element,
        content: helpers.centerText(" GARRISON | Troops: " + office.availableTroops, w),
        contentHasMarkup: true,
        x: 0,
        y: y++,
        autoWidth: true,
        attr: { bgColor: "gray", color: 'black', bold: true }
      });

      db.officers.filter(o => o.systemId == system.id && o.isCommander).forEach(officer => {
        ui.drawPerson(getPerson(officer.personId), element, 0, y++, "COM. ");
      })

      db.officers.filter(o => o.systemId == system.id && !o.isCommander).forEach(officer => {
        ui.drawPerson(getPerson(officer.personId), element, 0, y++);
      })

      new termkit.Text({
        parent: element,
        content: helpers.centerText("MERCENARIES", w),
        contentHasMarkup: true,
        x: 0,
        y: y++,
        autoWidth: true,
        attr: { bgColor: "gray", color: 'black', bold: true }
      });

      system.merc.forEach(m => {
        new termkit.Text({
          parent: element,
          content: m.name,
          leftPadding: " ",
          contentHasMarkup: true,
          x: 0,
          y: y,
          width: w - 7,
          attr: { bgColor: "black", color: 'white' }
        });

        new termkit.Text({
          parent: element,
          content: `${m.strength} / ${m.price}C`,
          rightPadding: " ",
          contentHasMarkup: true,
          x: w - 7,
          y: y++,
          width: 7,
          attr: { bgColor: "black", color: 'white' }
        });
      });

      let cmItems = [
        {
          content: '^[bgWhite]' + helpers.centerText(system.name, w),
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
        parent: element,
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
          content: ` Influence: ^[black]${player.influence} `,
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
      let cheapestShare = db.company.shares.find(o => o.personId == 0);

      let items = [
      {
        content: '^[bgWhite]      Choose action      ',
        disabled: true,
        markup: true
      },
      {
        content: `  ${player.lastAction == "spaceyard" ? "^+" : ""}Buy Spaceyard ${player.lastAction == "spaceyard" ? "x2" : "  "}   ${db.prices.spaceyard}C  `,
        value: 'spaceyard',
        markup: true,
        disabled: player.money < db.prices.spaceyard || player.confirm || player.buyingShare || player.hiringExecutive
      },
      {
        content: `  ${player.lastAction == "factory" ? "^+" : ""}Buy Factory ${player.lastAction == "factory" ? "x2" : "  "}     ${db.prices.factory}C  `,
        value: 'factory',
        markup: true,
        disabled: player.money < db.prices.factory || player.confirm || player.buyingShare || player.hiringExecutive
      },
      {
        content: `  ${player.lastAction == "luxury" ? "^+" : ""}Buy Luxury ${player.lastAction == "luxury" ? "x2" : "  "}      ${db.prices.luxury}C  `,
        value: 'luxury',
        markup: true,
        disabled: player.money < db.prices.luxury || player.confirm || player.buyingShare || player.hiringExecutive
      },
      {
        content: `  ${player.lastAction == "share" ? "^+" : ""}Hire Investor ${player.lastAction == "share" ? "x2" : "  "}      ►`,
        value: 'share',
        markup: true,
        disabled: cheapestShare === undefined || player.influence < cheapestShare.price || player.confirm || player.hiringExecutive,
        items: []
      },
      {
        content: `  ${player.lastAction == "officer" ? "^+" : ""}Hire Officer ${player.lastAction == "officer" ? "x2" : "  "}    ${db.prices.officer}I  `,
        value: 'officer',
        markup: true,
        disabled: player.confirm || player.buyingShare || player.influence < db.prices.officer || player.hiringExecutive
      },
      {
        content: `  ${player.lastAction == "executive" ? "^+" : ""}Hire Executive ${player.lastAction == "executive" ? "x2" : "  "}  ${db.prices.executive}I ►`,
        value: 'executive',
        markup: true,
        disabled: player.confirm || player.buyingShare || player.influence < db.prices.executive,
        items: []
      }]

      await db.company.shares.forEach((share, idx) => {
        items[4].items.push({
          content: `  ${share.price}I  `,
          value: 'share' + idx,
          markup: true,
          disabled: player.influence < share.price || share.personId != 0 || player.confirm
        });
      });

      await db.systems.forEach((system, idx) => {
        items[6].items.push({
          content: `  ${system.name}  `,
          value: 'executive' + system.id,
          markup: true
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

    ui.drawOffice(getOffice("chairman"), ui.document.elements.office1, 0, 0);
    ui.drawOffice(getOffice("tradeDirector"), ui.document.elements.office1, 0, 2);
    ui.drawOffice(getOffice("shippingManager"), ui.document.elements.office1, 0, 4);
    ui.drawOffice(getOffice("militaryAffairs"), ui.document.elements.office2, 0, 0);
    ui.drawOffice(getOffice("chancellor"), ui.document.elements.office1, 0, 6);

    ui.drawEnlisted(ui.document.elements.office2, 0, 2);
  },

  drawPerson: async (person, parent, x, y, prefix) => {
    const player = person.getMostInfluentialPlayer();

    new termkit.Text({
      parent: parent,
      content: (prefix ? prefix : "") + person.name,
      contentHasMarkup: true,
      contentEllipsis: '…',
      leftPadding: ' ',
      x: x,
      y: y,
      width: parent.outputWidth - 3 - db.players.length,
      attr: { bgColor: "black", color: player ? player.color : "white" }
    });

    new termkit.Text({
      parent: parent,
      content: person.influenceString(),
      contentHasMarkup: true,
      leftPadding: '|',
      rightPadding: '| ',
      y: y,
      x: x + parent.outputWidth - 3 - db.players.length,
      width: 3 + db.players.length,
      attr: { bgColor: "black" }
    });    
  },

  drawOffice: async (office, parent, x, y) => {
    const person = getPerson(office.personId);    
    const player = person.getMostInfluentialPlayer();

    new termkit.Text({
      parent: parent,
      content: office.label + (office.money ? ` | Money: ${office.money}` : ""),
      contentHasMarkup: true,
      leftPadding: ' ',
      x: x,
      y: y,
      autoWidth: true,
      attr: { bgColor: player ? player.color : "white", color: 'black', bold: true }
    });

    ui.drawPerson(person, parent, x, y + 1);
  },

  drawEnlisted: async (parent, x, y) => {
    new termkit.Text({
      parent: parent,
      content: helpers.centerText("ENSIGNS", parent.outputWidth),
      contentHasMarkup: true,
      x: x,
      y: y,
      autoWidth: true,
      attr: { bgColor: "gray", color: 'black', bold: true }
    });

    const ma = getOffice("militaryAffairs");
    ma.ensigns.forEach(id => {
      const person = getPerson(id);
      ui.drawPerson(person, parent, x, ++y);
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