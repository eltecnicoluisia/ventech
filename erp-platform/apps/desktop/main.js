const { app, BrowserWindow, ipcMain, shell, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// ─── Config ───────────────────────────────────────────────────────────────────
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch {}
  return null;
}

function saveConfig(config) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('Error guardando config:', e);
  }
}

// ─── Test Connectivity ─────────────────────────────────────────────────────────
function testConnection(url) {
  return new Promise((resolve) => {
    try {
      const testUrl = new URL(url);
      const mod = testUrl.protocol === 'https:' ? require('https') : http;
      const req = mod.get(`${url}/api/exchange/bcv`, { timeout: 5000 }, (res) => {
        resolve(res.statusCode < 500);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch {
      resolve(false);
    }
  });
}

// ─── Windows ──────────────────────────────────────────────────────────────────
let mainWindow = null;
let splashWindow = null;
let setupWindow = null;
let tray = null;

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.show();
}

function createSetup() {
  setupWindow = new BrowserWindow({
    width: 520,
    height: 480,
    frame: false,
    resizable: false,
    center: true,
    backgroundColor: '#18181b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  setupWindow.loadFile(path.join(__dirname, 'setup.html'));
  setupWindow.show();

  if (splashWindow) { splashWindow.close(); splashWindow = null; }
}

function createMain(serverUrl) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#18181b',
    title: 'VENTECH ERP',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Menú nativo
  const menu = Menu.buildFromTemplate([
    {
      label: 'VENTECH ERP',
      submenu: [
        { label: 'Recargar', accelerator: 'F5', click: () => mainWindow?.reload() },
        { label: 'Pantalla completa', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: 'Configurar servidor', click: () => { mainWindow?.close(); createSetup(); } },
        { type: 'separator' },
        { label: 'Salir', accelerator: 'Alt+F4', click: () => app.quit() }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  // Tray icon
  try {
    const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.ico'));
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    tray.setToolTip('VENTECH ERP');
    tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
  } catch {}

  mainWindow.loadURL(serverUrl);

  mainWindow.webContents.on('did-finish-load', () => {
    if (splashWindow) { splashWindow.close(); splashWindow = null; }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-fail-load', (_e, errCode, errDesc) => {
    console.error('Error cargando:', errCode, errDesc);
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  });

  // Abrir links externos en el navegador
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('test-connection', async (_e, url) => {
  return await testConnection(url);
});

ipcMain.handle('save-server', async (_e, url) => {
  const config = { serverUrl: url, savedAt: new Date().toISOString() };
  saveConfig(config);
  if (setupWindow) { setupWindow.close(); setupWindow = null; }
  createSplash();
  setTimeout(() => createMain(url), 1000);
  return true;
});

ipcMain.handle('get-config', () => loadConfig());

// ─── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  createSplash();

  await new Promise(r => setTimeout(r, 1200)); // Mostrar splash brevemente

  const config = loadConfig();

  if (!config?.serverUrl) {
    createSetup();
    return;
  }

  // Verificar conectividad
  const ok = await testConnection(config.serverUrl);
  if (!ok) {
    createSetup();
    return;
  }

  createMain(config.serverUrl);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const config = loadConfig();
    if (config?.serverUrl) createMain(config.serverUrl);
    else createSetup();
  }
});
