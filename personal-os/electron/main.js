const { app, BrowserWindow, Tray, Menu, shell, nativeTheme } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const isPackaged = app.isPackaged;
const BACKEND_DIR = isPackaged
  ? path.join(process.resourcesPath, 'backend')
  : path.join(__dirname, '..', 'backend');

const PORT = process.env.PORT || 3001;
const APP_URL = `http://localhost:${PORT}`;
const LOG_FILE = path.join(app.getPath('userData'), 'backend.log');

let backendProcess = null;
let mainWindow = null;
let tray = null;
let isQuitting = false;

function log(line) {
  try { fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${line}\n`); } catch { /* ignore */ }
}

function startBackend() {
  const entry = path.join(BACKEND_DIR, 'src', 'index.js');
  backendProcess = spawn(process.execPath, [entry], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: String(PORT), ELECTRON_RUN_AS_NODE: '1' },
  });

  backendProcess.stdout.on('data', (d) => log(d.toString()));
  backendProcess.stderr.on('data', (d) => log(d.toString()));
  backendProcess.on('exit', (code) => log(`Backend encerrado (code ${code})`));
}

function waitForServer(cb, attemptsLeft = 60) {
  http.get(APP_URL + '/api/health', (res) => {
    res.resume();
    cb(true);
  }).on('error', () => {
    if (attemptsLeft <= 0) return cb(false);
    setTimeout(() => waitForServer(cb, attemptsLeft - 1), 500);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#050d08',
    title: 'Personal OS',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(APP_URL);

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'trayicon.png'));
  tray.setToolTip('Personal OS');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir Painel', click: () => { mainWindow?.show(); } },
    { label: 'Ver logs (QR Code do WhatsApp)', click: () => shell.openPath(LOG_FILE) },
    { type: 'separator' },
    { label: 'Sair', click: () => { isQuitting = true; app.quit(); } },
  ]));
  tray.on('click', () => { mainWindow?.show(); });
}

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark';
  startBackend();
  createTray();

  waitForServer((ok) => {
    createWindow();
    if (!ok) {
      log('AVISO: servidor não respondeu a tempo, abrindo mesmo assim.');
    }
  });
});

app.on('window-all-closed', () => {
  // Keep running in the tray — the backend also serves the phone/Tailscale access.
});

app.on('before-quit', () => {
  isQuitting = true;
  if (backendProcess) backendProcess.kill();
});

app.on('activate', () => {
  if (mainWindow) mainWindow.show();
});
