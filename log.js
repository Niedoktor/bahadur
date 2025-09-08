const termkit = require('terminal-kit');

const log = {
  messages: "",
  createTextBox: async (parent) => {
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
      content: log.messages
      //textAttr: { bgColor: 'gray' },
      //voidAttr: { bgColor: 'gray' }
    });
    log.tb.scrollToBottom();
  },

  append: (msg) => {
    log.messages += msg + "\n";
    if(log.tb) log.tb.appendLog(msg);
  }
}

exports = module.exports = log;