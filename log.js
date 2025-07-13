const termkit = require('terminal-kit');

let log = {
  init: async (parent) => {
    log.parent = parent;
    log.tb = new termkit.TextBox({
      parent: parent,
      x: 0,
      y: 0,
      autoWidth: true,
      autoHeight: true,
      wordWrap: true,
      scrollable: true,
      vScrollBar : true,
      contentHasMarkup: true,
      //textAttr: { bgColor: 'gray' },
      //voidAttr: { bgColor: 'gray' }
    });
    log.print("log.init");
  },

  print: (msg) => {
    log.tb.appendLog(msg);
  }
}

exports = module.exports = log;