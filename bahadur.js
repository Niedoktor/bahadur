require('terminal-kit').getDetectedTerminal(function(error, term) {
	function terminate()
	{
		setTimeout(function() {
			term.grabInput(false);
			term.fullscreen(false);
			term.applicationKeypad(false);
			setTimeout(function() { process.exit() ; }, 100);
		}, 100);
	} 

	term.fullscreen();
	term.applicationKeypad();

  var items = [ 'BAHADUR' , 'Edit' , 'View' , 'History' , 'Bookmarks' , 'Tools' , 'Help' ] ;

  var options = {
    y: 1 ,	// the menu will be on the top of the terminal
    style: term.inverse,
    selectedStyle: term.dim.blue.bgGreen
  };

  term.clear();
  menu();

  function menu(){
    term.singleLineMenu( items , options , function( error , response ) {
      term( '\n' ).eraseLineAfter.green(
        "#%s selected: %s (%s,%s)\n" ,
        response.selectedIndex ,
        response.selectedText ,
        response.x ,
        response.y
      );
      menu();
    });
  }

	term.grabInput({ mouse: 'motion', focus: true });
	term.requestCursorLocation().requestScreenSize();

	let x = '', y = '', width = '', height = '';

	term.on('key', function(key, matches, data) {
		switch(key)
		{
			case 'CTRL_C': terminate(); break;
		}
	});

	term.on('terminal', function(name, data) {
		switch (name)
		{
			case 'CURSOR_LOCATION': x = data.x; y = data.y; break;
			case 'SCREEN_SIZE' : width = data.width; height = data.height; break;
		}
	});

	term.on('mouse', function(name, data) {
		//console.log( "'mouse' event:" , name , data ) ;
	});
});