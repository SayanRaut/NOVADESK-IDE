let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	windowControl: (action) => electron.ipcRenderer.invoke("window:control", action),
	setZoom: (zoomFactor) => electron.ipcRenderer.invoke("window:setZoom", zoomFactor),
	setTheme: (theme) => electron.ipcRenderer.invoke("window:setTheme", theme),
	openFolder: () => electron.ipcRenderer.invoke("workspace:openFolder"),
	chooseFolder: () => electron.ipcRenderer.invoke("workspace:chooseFolder"),
	showSaveDialog: (defaultPath) => electron.ipcRenderer.invoke("workspace:showSaveDialog", defaultPath),
	setWorkspace: (rootPath) => electron.ipcRenderer.invoke("workspace:setWorkspace", rootPath),
	readDirectory: (directoryPath) => electron.ipcRenderer.invoke("workspace:readDirectory", directoryPath),
	readFile: (filePath) => electron.ipcRenderer.invoke("workspace:readFile", filePath),
	writeFile: (filePath, content) => electron.ipcRenderer.invoke("workspace:writeFile", filePath, content),
	createFile: (parentPath, name, content) => electron.ipcRenderer.invoke("workspace:createFile", parentPath, name, content),
	createFolder: (parentPath, name) => electron.ipcRenderer.invoke("workspace:createFolder", parentPath, name),
	renameFile: (oldPath, newName) => electron.ipcRenderer.invoke("workspace:rename", oldPath, newName),
	deleteFile: (targetPath) => electron.ipcRenderer.invoke("workspace:delete", targetPath),
	duplicateFile: (targetPath) => electron.ipcRenderer.invoke("workspace:duplicate", targetPath),
	revealInExplorer: (targetPath) => electron.ipcRenderer.invoke("workspace:reveal", targetPath),
	searchWorkspace: (query) => electron.ipcRenderer.invoke("workspace:search", query),
	createProject: (parentDirectory, name, template) => electron.ipcRenderer.invoke("workspace:createProject", parentDirectory, name, template),
	cloneRepository: (repositoryUrl, parentDirectory, name) => electron.ipcRenderer.invoke("workspace:cloneRepository", repositoryUrl, parentDirectory, name),
	onWorkspaceFileChanged: (callback) => {
		const listener = (_event, payload) => callback(payload);
		electron.ipcRenderer.on("workspace:fileChanged", listener);
		return () => electron.ipcRenderer.removeListener("workspace:fileChanged", listener);
	},
	gitStatus: () => electron.ipcRenderer.invoke("git:status"),
	gitInit: () => electron.ipcRenderer.invoke("git:init"),
	gitLog: (maxCount) => electron.ipcRenderer.invoke("git:log", maxCount),
	gitBranches: () => electron.ipcRenderer.invoke("git:branches"),
	gitAdd: (filePath) => electron.ipcRenderer.invoke("git:add", filePath),
	gitAddFromDialog: () => electron.ipcRenderer.invoke("git:addFromDialog"),
	gitAddAll: () => electron.ipcRenderer.invoke("git:addAll"),
	gitUnstage: (filePath) => electron.ipcRenderer.invoke("git:unstage", filePath),
	gitCommit: (message) => electron.ipcRenderer.invoke("git:commit", message),
	gitPush: (branch) => electron.ipcRenderer.invoke("git:push", branch),
	gitCheckout: (branch, isNew = false) => electron.ipcRenderer.invoke("git:checkout", branch, isNew),
	gitRemoteAdd: (url) => electron.ipcRenderer.invoke("git:remoteAdd", url),
	gitRemoteRemove: () => electron.ipcRenderer.invoke("git:remoteRemove"),
	gitRemoteUrl: () => electron.ipcRenderer.invoke("git:remoteUrl"),
	openExternal: (url) => electron.ipcRenderer.invoke("system:openExternal", url),
	gitDiffBranches: (base, compare) => electron.ipcRenderer.invoke("git:diffBranches", base, compare),
	getAIConnection: () => electron.ipcRenderer.invoke("ai:getConnection"),
	saveAIConnection: (connection) => electron.ipcRenderer.invoke("ai:saveConnection", connection),
	clearAIConnection: () => electron.ipcRenderer.invoke("ai:clearConnection"),
	testAIConnection: () => electron.ipcRenderer.invoke("ai:testConnection"),
	chatWithAI: (payload) => electron.ipcRenderer.invoke("ai:chat", payload),
	subscribeTerminal: () => electron.ipcRenderer.send("terminal:subscribe"),
	createTerminal: (cwd) => electron.ipcRenderer.invoke("terminal:create", cwd),
	killTerminal: (id) => electron.ipcRenderer.invoke("terminal:kill", id),
	onTerminalData: (callback) => {
		const listener = (_event, payload) => callback(payload);
		electron.ipcRenderer.on("terminal:data", listener);
		return () => electron.ipcRenderer.removeListener("terminal:data", listener);
	},
	onTerminalExit: (callback) => {
		const listener = (_event, id) => callback(id);
		electron.ipcRenderer.on("terminal:exit", listener);
		return () => electron.ipcRenderer.removeListener("terminal:exit", listener);
	},
	writeTerminal: (id, data) => electron.ipcRenderer.send("terminal:write", id, data),
	resizeTerminal: (id, cols, rows) => electron.ipcRenderer.send("terminal:resize", id, cols, rows),
	spawnTask: (command) => electron.ipcRenderer.invoke("tasks:spawn", command),
	killTask: (id) => electron.ipcRenderer.invoke("tasks:kill", id),
	startGoogleLogin: () => electron.ipcRenderer.invoke("auth:startGoogleLogin"),
	onGoogleAuth: (callback) => {
		const listener = (_event, payload) => callback(payload);
		electron.ipcRenderer.on("auth:callback", listener);
		return () => electron.ipcRenderer.removeListener("auth:callback", listener);
	},
	checkPendingAuth: () => electron.ipcRenderer.invoke("auth:checkPending"),
	saveTokens: (tokens) => electron.ipcRenderer.invoke("auth:saveTokens", tokens),
	getTokens: () => electron.ipcRenderer.invoke("auth:getTokens"),
	clearTokens: () => electron.ipcRenderer.invoke("auth:clearTokens"),
	saveApiConfig: (config) => electron.ipcRenderer.invoke("api:saveConfig", config),
	getApiConfig: () => electron.ipcRenderer.invoke("api:getConfig"),
	searchExtensions: (query, sortBy, sortOrder, offset) => electron.ipcRenderer.invoke("extensions:search", query, sortBy, sortOrder, offset),
	installExtension: (namespace, name) => electron.ipcRenderer.invoke("extensions:install", namespace, name),
	uninstallExtension: (id) => electron.ipcRenderer.invoke("extensions:uninstall", id),
	getInstalledExtensions: () => electron.ipcRenderer.invoke("extensions:getInstalled"),
	toggleExtension: (id, enabled) => electron.ipcRenderer.invoke("extensions:toggle", id, enabled)
});
//#endregion
