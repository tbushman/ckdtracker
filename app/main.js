var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain = electron.ipcMain;
var fs = require('fs');
var async = require('async');
var Menu = electron.Menu;
var counter = 0;
var scale = [
	{w:150, h:150},
	{w:130, h:555}
]


var windowWidth, windowHeight, bounds, aspectRatio, screenWidth = null, screenHeight = null, mainWindow = null;
function handleThemeChange(bounds){
	mainWindow.setContentBounds(bounds)
	aspectRatio = bounds.width / bounds.height;
	mainWindow.setAspectRatio(aspectRatio);
}

ipcMain.on('screen-size', function(e, size){
	screenWidth = size.screenwidth;
	screenHeight = size.screenheight;
	theme = parseInt(size.theme,10);
	windowWidth = scale[theme].w;
	windowHeight = scale[theme].h;
	bounds = {
		x: screenWidth - windowWidth,
		y: screenHeight - windowHeight,
		width: windowWidth,
		height: windowHeight 
	};
	
	handleThemeChange(bounds);
})


// chrome resolution fix
app.commandLine.appendSwitch('high-dpi-support', 1);
app.commandLine.appendSwitch('force-device-scale-factor', 1);
//app.setBounds(bounds);
// Quit when all windows are closed
app.on('window-all-closed', function() {	
	app.quit();
});

// When application is ready, create application window
app.on('ready', function() {
	windowWidth = windowWidth ? windowWidth : 150;
	windowHeight = windowHeight ? windowHeight : 150;
	app.setAppUserModelId('com.electron.breath_b');
	// Create main window
	// Other options available at:
	// http://electron.atom.io/docs/latest/api/browser-window/#new-browserwindow-options
	mainWindow = new BrowserWindow({
		name: "breath",
		width: windowWidth,
		height: windowHeight,
		x: screenWidth ? bounds.x : 0,
		y: screenHeight ? bounds.y : 0,
		useContentSize: true,
		minimizable: true
	});
	mainWindow.setAspectRatio(windowWidth/windowHeight);
	var template = [
	{
		label: 'Theme',
		submenu: [
			{ 
				label: 'grow',
				click () { 
					mainWindow.webContents.send('theme', '0')
					
				}
			},
			{ 
				label: 'rise',
				click () { 
					mainWindow.webContents.send('theme', '1')
				}
			}
		]
	},
	{
		role: 'window',
		submenu: [
			{ role: 'minimize' },
			{ role: 'close' },
			{
				label: 'Toggle Developer Tools',
				click () {
					mainWindow.webContents.toggleDevTools()
				}
			}
		]
	},
	{
		role: 'Help',
		submenu: [
			{
				label: 'Learn More',
				click () { require('electron').shell.openExternal('https://github.com/tbushman/breath/blob/master/README.md') }
			}
		]
	}]
		
	mainWindow.focus();
	// Target HTML file which will be opened in window
	mainWindow.loadURL('file://' + __dirname + '/index.html');
		
	var menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu);
	
	// Cleanup when window is closed
	mainWindow.on('closed', function() {
		mainWindow = null;
	});
 
});