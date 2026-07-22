const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("zeffBackup", {
  listDrives: () => ipcRenderer.invoke("backup:listDrives"),
  setTargetPath: (path) => ipcRenderer.invoke("backup:setTargetPath", path),
  getTargetPath: () => ipcRenderer.invoke("backup:getTargetPath"),
  writeBackupFile: (fileName, base64) =>
    ipcRenderer.invoke("backup:writeBackupFile", fileName, base64),
  getLastRunAt: () => ipcRenderer.invoke("backup:getLastRunAt"),
  runScheduledCheck: () => ipcRenderer.invoke("backup:runScheduledCheck"),
});
