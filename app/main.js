const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function startApp() {
  ipcMain.handle('get-cities', (event, query) => {
    return new Promise((resolve, reject) => {
      db.cities.find({ city: new RegExp('^' + query) }, (err, docs) => {
        if (err) {
          reject(err);
        }
        resolve(docs);
      });
    });
  });
}


function createWindow () {
  let win = new BrowserWindow({
    width: 500,
    height: 300,
    x: 0,
    y: 0,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true
    },
    icon: __dirname + '/../resources/images/logo.png', // Add this line
    title: "RyanAir Parser"
  });

  win.setMenuBarVisibility(false);
  win.loadFile('app/pages/mainWindow.html');
}

ipcMain.on('open-new-window', (event, arg, coord) => {
  let newWin = new BrowserWindow({
    width: 600,
    height: 500,
    x: coord.x,
    y: coord.y,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true
    },
    icon: __dirname + '/../resources/images/logo.png', // Add this line
  });

  newWin.setMenuBarVisibility(false);
  newWin.loadFile('app/pages/resultWindow.html');
  newWin.webContents.on('did-finish-load', () => {
    newWin.webContents.send('data', arg);
  });
});

app.whenReady().then(createWindow);
