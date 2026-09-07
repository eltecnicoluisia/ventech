const fs = require('fs');
const content = \const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { utilityProcess } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// --- Rutas -------------------------------------------------------------------
function res(...parts) {
  return app.isPackaged
    ? path.join(process.resourcesPath, ...parts)
    : path.join(__dirname, 'resources', ...parts);
}

let splashWin = null;
let mainWin   = null;
let apiProc   = null;
let webProc   = null;
let isShuttingDown = false;

// --- Single Instance Lock ----------------------------------------------------
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWin) {
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.focus();
    }
  });

  // --- Splash ------------------------------------------------------------------
  function createSplash() {
    splashWin = new BrowserWindow({
      width: 480, height: 320,
      frame: false, transparent: true,
      resizable: false, center: true,
      alwaysOnTop: true, skipTaskbar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false }
    });
    splashWin.loadFile(path.join(__dirname, 'splash.html'));
    splashWin.show();
  }

  function setSplashStatus(msg) {
    if (splashWin?.webContents) {
      splashWin.webContents.executeJavaScript(\\\setStatus(\\\)\\\).catch(() => {});
    }
  }

  // --- Ventana principal -------------------------------------------------------
  function createMain() {
    mainWin = new BrowserWindow({
      width: 1400, height: 900,
      minWidth: 1024, minHeight: 700,
      show: false,
      backgroundColor: '#18181b',
      title: 'VENTECH ERP',
      icon: path.join(__dirname, 'assets', 'icon.ico'),
      webPreferences: { contextIsolation: true, nodeIntegration: false }
    });

    const menu = Menu.buildFromTemplate([
      { label: 'VENTECH ERP', submenu: [
        { label: 'Recargar', accelerator: 'F5', click: () => mainWin?.reload() },
        { label: 'Pantalla completa', accelerator: 'F11', click: () => mainWin?.setFullScreen(!mainWin.isFullScreen()) },
        { type: 'separator' },
        { label: 'Salir', accelerator: 'Alt+F4', click: () => app.quit() }
      ]},
      { label: 'Ver', submenu: [
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn',    label: 'Acercar'    },
        { role: 'zoomOut',   label: 'Alejar'     },
      ]}
    ]);
    Menu.setApplicationMenu(menu);

    mainWin.loadURL('http://127.0.0.1:3000');

    mainWin.webContents.on('did-finish-load', () => {
      if (splashWin) { splashWin.close(); splashWin = null; }
      mainWin.show();
      mainWin.focus();
    });

    mainWin.on('closed', () => { mainWin = null; });
  }

  // --- Esperar puerto ----------------------------------------------------------
  function waitForPort(port, proc, maxWait = 45000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      let hasExited = false;
      
      if (proc) {
        proc.once('exit', (code) => {
          hasExited = true;
          if (!isShuttingDown) reject(new Error(\\\Process for port \\\ exited prematurely with code \\\\\\));
        });
      }

      const check = () => {
        if (hasExited) return;
        const req = http.get(\\\http://127.0.0.1:\\\\\\, { timeout: 1000 }, () => resolve())
          .on('error', () => {
            if (Date.now() - start > maxWait) reject(new Error(\\\Timeout waiting for port \\\\\\));
            else setTimeout(check, 800);
          });
        req.on('timeout', () => { req.destroy(); });
      };
      check();
    });
  }

  // --- Arrancar servicios ------------------------------------------------------
  async function startServices() {
    const userData = app.getPath('userData');
    fs.mkdirSync(userData, { recursive: true });
    const dbPath = path.join(userData, 'ventech.db');
    
    if (!fs.existsSync(dbPath)) {
      const templatePath = res('api', 'template.db');
      if (fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, dbPath);
      }
    }

    // 1. API NestJS
    setSplashStatus('Iniciando base de datos...');
    const apiScript = res('api', 'index.js');
    apiProc = utilityProcess.fork(apiScript, [], {
      serviceName: 'VENTECH-API',
      stdio: 'pipe',
      cwd: res('api'),
      env: {
        ...process.env,
        DATABASE_URL: \\\ile:\\\\\\,
        PORT: '3001',
        NODE_ENV: 'production',
        VENTECH_DESKTOP: '1',
      }
    });
    const logFile = fs.createWriteStream(path.join(userData, 'services.log'), { flags: 'a' });
    logFile.write(\\\\\n\\n--- NEW SESSION \\\ ---\\n\\\);
    apiProc.stdout.on('data', (d) => logFile.write(\\\[API] \\\\\\));
    apiProc.stderr.on('data', (d) => logFile.write(\\\[API-ERR] \\\\\\));
    
    setSplashStatus('Iniciando servidor API...');
    await waitForPort(3001, apiProc);

    // 2. Servidor Web Next.js
    setSplashStatus('Iniciando interfaz grafica...');
    const webScript = res('web', 'apps', 'web', 'server.js');
    webProc = utilityProcess.fork(webScript, [], {
      serviceName: 'VENTECH-WEB',
      stdio: 'pipe',
      cwd: res('web', 'apps', 'web'),
      env: {
        ...process.env,
        PORT: '3000',
        HOSTNAME: '127.0.0.1',
        NODE_ENV: 'production',
      }
    });
    webProc.stdout.on('data', (d) => logFile.write(\\\[WEB] \\\\\\));
    webProc.stderr.on('data', (d) => logFile.write(\\\[WEB-ERR] \\\\\\));

    setSplashStatus('Cargando VENTECH ERP...');
    await waitForPort(3000, webProc);
  }

  // --- Lifecycle ---------------------------------------------------------------
  app.whenReady().then(async () => {
    createSplash();
    await new Promise(r => setTimeout(r, 800)); // mostrar splash

    try {
      await startServices();
      createMain();
    } catch (err) {
      console.error('Error iniciando servicios:', err);
      if (splashWin) {
        splashWin.webContents.executeJavaScript(
          \\\setStatus("Error critico: \\\. Revisa services.log")\\\
        ).catch(() => {});
      }
    }
  });

  app.on('before-quit', () => {
    isShuttingDown = true;
    try { apiProc?.kill(); } catch {}
    try { webProc?.kill(); } catch {}
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
\;
fs.writeFileSync('desktop-app/main.js', content);
