import require$$0 from "electron";
import require$$1 from "path";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var background$1 = {};
var hasRequiredBackground;
function requireBackground() {
  if (hasRequiredBackground) return background$1;
  hasRequiredBackground = 1;
  const { app, BrowserWindow } = require$$0;
  const { join } = require$$1;
  process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
  const createWindow = () => {
    const win = new BrowserWindow({
      // 窗口图标
      icon: join(__dirname, "resource/shortcut.ico"),
      width: 800,
      height: 600,
      frame: false,
      transparent: true,
      titleBarStyle: "hidden",
      webPreferences: {
        devTools: false,
        nodeIntegration: true,
        enablemotemodule: true
      }
    });
    if (process.env.VITE_DEV_SERVER_URL) {
      win.loadURL(process.env.VITE_DEV_SERVER_URL);
      win.webContents.openDevTools();
    } else {
      win.loadFile(join(__dirname, "dist/index.html"));
    }
  };
  app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  return background$1;
}
var backgroundExports = requireBackground();
const background = /* @__PURE__ */ getDefaultExportFromCjs(backgroundExports);
export {
  background as default
};
