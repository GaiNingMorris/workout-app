const { app, BrowserWindow } = require('electron');
const path = require('path');
function createWindow(){
  const win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 1024, minHeight: 700,
    backgroundColor: '#0b1220',
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}
app.whenReady().then(()=>{ createWindow(); app.on('activate', ()=>{ if(BrowserWindow.getAllWindows().length===0) createWindow(); }); });
app.on('window-all-closed', ()=>{ if(process.platform!=='darwin') app.quit(); });
