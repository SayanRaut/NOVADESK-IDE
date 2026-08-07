import { createRequire } from "node:module";
import { BrowserWindow, app, dialog, ipcMain, net, safeStorage, shell } from "electron";
import { randomBytes, randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import * as fs$1 from "fs";
import fs from "fs";
import os from "os";
import * as path$1 from "path";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire as createRequire$1 } from "module";
import extract from "extract-zip";
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* #__PURE__ */ (() => createRequire(import.meta.url))();
//#endregion
//#region electron/extensions/OpenVSXClient.ts
var import_main = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs$2 = __require("fs");
	var path$2 = __require("path");
	var os$1 = __require("os");
	var crypto = __require("crypto");
	var TIPS = [
		"◈ encrypted .env [www.dotenvx.com]",
		"◈ secrets for agents [www.dotenvx.com]",
		"⌁ auth for agents [www.vestauth.com]",
		"⌘ custom filepath { path: '/custom/path/.env' }",
		"⌘ enable debugging { debug: true }",
		"⌘ override existing { override: true }",
		"⌘ suppress logs { quiet: true }",
		"⌘ multiple files { path: ['.env.local', '.env'] }"
	];
	function _getRandomTip() {
		return TIPS[Math.floor(Math.random() * TIPS.length)];
	}
	function parseBoolean(value) {
		if (typeof value === "string") return ![
			"false",
			"0",
			"no",
			"off",
			""
		].includes(value.toLowerCase());
		return Boolean(value);
	}
	function supportsAnsi() {
		return process.stdout.isTTY;
	}
	function dim(text) {
		return supportsAnsi() ? `\x1b[2m${text}\x1b[0m` : text;
	}
	var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;
	function parse(src) {
		const obj = {};
		let lines = src.toString();
		lines = lines.replace(/\r\n?/gm, "\n");
		let match;
		while ((match = LINE.exec(lines)) != null) {
			const key = match[1];
			let value = match[2] || "";
			value = value.trim();
			const maybeQuote = value[0];
			value = value.replace(/^(['"`])([\s\S]*)\1$/gm, "$2");
			if (maybeQuote === "\"") {
				value = value.replace(/\\n/g, "\n");
				value = value.replace(/\\r/g, "\r");
			}
			obj[key] = value;
		}
		return obj;
	}
	function _parseVault(options) {
		options = options || {};
		const vaultPath = _vaultPath(options);
		options.path = vaultPath;
		const result = DotenvModule.configDotenv(options);
		if (!result.parsed) {
			const err = /* @__PURE__ */ new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
			err.code = "MISSING_DATA";
			throw err;
		}
		const keys = _dotenvKey(options).split(",");
		const length = keys.length;
		let decrypted;
		for (let i = 0; i < length; i++) try {
			const attrs = _instructions(result, keys[i].trim());
			decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
			break;
		} catch (error) {
			if (i + 1 >= length) throw error;
		}
		return DotenvModule.parse(decrypted);
	}
	function _warn(message) {
		console.error(`⚠ ${message}`);
	}
	function _debug(message) {
		console.log(`┆ ${message}`);
	}
	function _log(message) {
		console.log(`◇ ${message}`);
	}
	function _dotenvKey(options) {
		if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) return options.DOTENV_KEY;
		if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) return process.env.DOTENV_KEY;
		return "";
	}
	function _instructions(result, dotenvKey) {
		let uri;
		try {
			uri = new URL(dotenvKey);
		} catch (error) {
			if (error.code === "ERR_INVALID_URL") {
				const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
				err.code = "INVALID_DOTENV_KEY";
				throw err;
			}
			throw error;
		}
		const key = uri.password;
		if (!key) {
			const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: Missing key part");
			err.code = "INVALID_DOTENV_KEY";
			throw err;
		}
		const environment = uri.searchParams.get("environment");
		if (!environment) {
			const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: Missing environment part");
			err.code = "INVALID_DOTENV_KEY";
			throw err;
		}
		const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
		const ciphertext = result.parsed[environmentKey];
		if (!ciphertext) {
			const err = /* @__PURE__ */ new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
			err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
			throw err;
		}
		return {
			ciphertext,
			key
		};
	}
	function _vaultPath(options) {
		let possibleVaultPath = null;
		if (options && options.path && options.path.length > 0) if (Array.isArray(options.path)) {
			for (const filepath of options.path) if (fs$2.existsSync(filepath)) possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
		} else possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
		else possibleVaultPath = path$2.resolve(process.cwd(), ".env.vault");
		if (fs$2.existsSync(possibleVaultPath)) return possibleVaultPath;
		return null;
	}
	function _resolveHome(envPath) {
		return envPath[0] === "~" ? path$2.join(os$1.homedir(), envPath.slice(1)) : envPath;
	}
	function _configVault(options) {
		const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
		const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
		if (debug || !quiet) _log("loading env from encrypted .env.vault");
		const parsed = DotenvModule._parseVault(options);
		let processEnv = process.env;
		if (options && options.processEnv != null) processEnv = options.processEnv;
		DotenvModule.populate(processEnv, parsed, options);
		return { parsed };
	}
	function configDotenv(options) {
		const dotenvPath = path$2.resolve(process.cwd(), ".env");
		let encoding = "utf8";
		let processEnv = process.env;
		if (options && options.processEnv != null) processEnv = options.processEnv;
		let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
		let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
		if (options && options.encoding) encoding = options.encoding;
		else if (debug) _debug("no encoding is specified (UTF-8 is used by default)");
		let optionPaths = [dotenvPath];
		if (options && options.path) if (!Array.isArray(options.path)) optionPaths = [_resolveHome(options.path)];
		else {
			optionPaths = [];
			for (const filepath of options.path) optionPaths.push(_resolveHome(filepath));
		}
		let lastError;
		const parsedAll = {};
		for (const path of optionPaths) try {
			const parsed = DotenvModule.parse(fs$2.readFileSync(path, { encoding }));
			DotenvModule.populate(parsedAll, parsed, options);
		} catch (e) {
			if (debug) _debug(`failed to load ${path} ${e.message}`);
			lastError = e;
		}
		const populated = DotenvModule.populate(processEnv, parsedAll, options);
		debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
		quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
		if (debug || !quiet) {
			const keysCount = Object.keys(populated).length;
			const shortPaths = [];
			for (const filePath of optionPaths) try {
				const relative = path$2.relative(process.cwd(), filePath);
				shortPaths.push(relative);
			} catch (e) {
				if (debug) _debug(`failed to load ${filePath} ${e.message}`);
				lastError = e;
			}
			_log(`injected env (${keysCount}) from ${shortPaths.join(",")} ${dim(`// tip: ${_getRandomTip()}`)}`);
		}
		if (lastError) return {
			parsed: parsedAll,
			error: lastError
		};
		else return { parsed: parsedAll };
	}
	function config(options) {
		if (_dotenvKey(options).length === 0) return DotenvModule.configDotenv(options);
		const vaultPath = _vaultPath(options);
		if (!vaultPath) {
			_warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`);
			return DotenvModule.configDotenv(options);
		}
		return DotenvModule._configVault(options);
	}
	function decrypt(encrypted, keyStr) {
		const key = Buffer.from(keyStr.slice(-64), "hex");
		let ciphertext = Buffer.from(encrypted, "base64");
		const nonce = ciphertext.subarray(0, 12);
		const authTag = ciphertext.subarray(-16);
		ciphertext = ciphertext.subarray(12, -16);
		try {
			const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
			aesgcm.setAuthTag(authTag);
			return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
		} catch (error) {
			const isRange = error instanceof RangeError;
			const invalidKeyLength = error.message === "Invalid key length";
			const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
			if (isRange || invalidKeyLength) {
				const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
				err.code = "INVALID_DOTENV_KEY";
				throw err;
			} else if (decryptionFailed) {
				const err = /* @__PURE__ */ new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
				err.code = "DECRYPTION_FAILED";
				throw err;
			} else throw error;
		}
	}
	function populate(processEnv, parsed, options = {}) {
		const debug = Boolean(options && options.debug);
		const override = Boolean(options && options.override);
		const populated = {};
		if (typeof parsed !== "object") {
			const err = /* @__PURE__ */ new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
			err.code = "OBJECT_REQUIRED";
			throw err;
		}
		for (const key of Object.keys(parsed)) if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
			if (override === true) {
				processEnv[key] = parsed[key];
				populated[key] = parsed[key];
			}
			if (debug) if (override === true) _debug(`"${key}" is already defined and WAS overwritten`);
			else _debug(`"${key}" is already defined and was NOT overwritten`);
		} else {
			processEnv[key] = parsed[key];
			populated[key] = parsed[key];
		}
		return populated;
	}
	var DotenvModule = {
		configDotenv,
		_configVault,
		_parseVault,
		config,
		decrypt,
		parse,
		populate
	};
	module.exports.configDotenv = DotenvModule.configDotenv;
	module.exports._configVault = DotenvModule._configVault;
	module.exports._parseVault = DotenvModule._parseVault;
	module.exports.config = DotenvModule.config;
	module.exports.decrypt = DotenvModule.decrypt;
	module.exports.parse = DotenvModule.parse;
	module.exports.populate = DotenvModule.populate;
	module.exports = DotenvModule;
})))(), 1);
var OpenVSXClient = class {
	static BASE_URL = "https://open-vsx.org/api";
	static async search(query = "", sortBy = "downloadCount", sortOrder = "desc", offset = 0, size = 20) {
		const url = `${this.BASE_URL}/-/search?query=${encodeURIComponent(query)}&sortBy=${sortBy}&sortOrder=${sortOrder}&offset=${offset}&size=${size}`;
		return new Promise((resolve, reject) => {
			const request = net.request(url);
			request.on("response", (response) => {
				if (response.statusCode !== 200) {
					reject(/* @__PURE__ */ new Error(`Open VSX API returned status ${response.statusCode}`));
					return;
				}
				let body = "";
				response.on("data", (chunk) => {
					body += chunk.toString();
				});
				response.on("end", () => {
					try {
						resolve(JSON.parse(body));
					} catch {
						reject(/* @__PURE__ */ new Error("Failed to parse Open VSX response"));
					}
				});
			});
			request.on("error", (error) => {
				reject(error);
			});
			request.end();
		});
	}
	static async getExtension(namespace, name) {
		const url = `${this.BASE_URL}/-/item/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;
		return new Promise((resolve, reject) => {
			const request = net.request(url);
			request.on("response", (response) => {
				if (response.statusCode !== 200) {
					reject(/* @__PURE__ */ new Error(`Open VSX API returned status ${response.statusCode}`));
					return;
				}
				let body = "";
				response.on("data", (chunk) => {
					body += chunk.toString();
				});
				response.on("end", () => {
					try {
						resolve(JSON.parse(body));
					} catch {
						reject(/* @__PURE__ */ new Error("Failed to parse Open VSX response"));
					}
				});
			});
			request.on("error", (error) => {
				reject(error);
			});
			request.end();
		});
	}
};
//#endregion
//#region electron/extensions/ExtensionRegistry.ts
var ExtensionRegistry = class {
	registryPath;
	installedExtensions;
	constructor() {
		const userDataPath = app.getPath("userData");
		this.registryPath = path$1.join(userDataPath, "extensions.json");
		this.installedExtensions = /* @__PURE__ */ new Map();
		this.load();
	}
	load() {
		if (fs$1.existsSync(this.registryPath)) try {
			const data = fs$1.readFileSync(this.registryPath, "utf8");
			JSON.parse(data).forEach((ext) => this.installedExtensions.set(ext.id, ext));
		} catch (e) {
			console.error("Failed to load extension registry", e);
		}
	}
	save() {
		try {
			const data = Array.from(this.installedExtensions.values());
			fs$1.writeFileSync(this.registryPath, JSON.stringify(data, null, 2), "utf8");
		} catch (e) {
			console.error("Failed to save extension registry", e);
		}
	}
	getInstalled() {
		return Array.from(this.installedExtensions.values());
	}
	getExtension(id) {
		return this.installedExtensions.get(id);
	}
	addExtension(ext) {
		this.installedExtensions.set(ext.id, {
			...ext,
			enabled: true,
			installedAt: Date.now()
		});
		this.save();
	}
	removeExtension(id) {
		if (this.installedExtensions.has(id)) {
			this.installedExtensions.delete(id);
			this.save();
		}
	}
	toggleExtension(id, enabled) {
		const ext = this.installedExtensions.get(id);
		if (ext) {
			ext.enabled = enabled;
			this.save();
		}
	}
};
var extensionRegistry = new ExtensionRegistry();
//#endregion
//#region electron/extensions/VSIXInstaller.ts
var VSIXInstaller = class {
	static extensionsDir = path$1.join(app.getPath("userData"), "extensions");
	static ensureDir(dir) {
		if (!fs$1.existsSync(dir)) fs$1.mkdirSync(dir, { recursive: true });
	}
	static async installFromOpenVSX(namespace, name) {
		try {
			const extInfo = await OpenVSXClient.getExtension(namespace, name);
			const downloadUrl = extInfo.files.download;
			const extensionId = `${namespace}.${name}`;
			this.ensureDir(this.extensionsDir);
			const installPath = path$1.join(this.extensionsDir, extensionId);
			const tempZipPath = path$1.join(this.extensionsDir, `${extensionId}.temp.vsix`);
			await new Promise((resolve, reject) => {
				const request = net.request(downloadUrl);
				const fileStream = fs$1.createWriteStream(tempZipPath);
				request.on("response", (response) => {
					if (response.statusCode !== 200) {
						reject(/* @__PURE__ */ new Error(`Failed to download extension: HTTP ${response.statusCode}`));
						return;
					}
					response.on("data", (chunk) => {
						fileStream.write(chunk);
					});
					response.on("end", () => {
						fileStream.end();
						resolve();
					});
				});
				request.on("error", (error) => {
					fileStream.close();
					fs$1.unlinkSync(tempZipPath);
					reject(error);
				});
				request.end();
			});
			if (fs$1.existsSync(installPath)) fs$1.rmSync(installPath, {
				recursive: true,
				force: true
			});
			await extract(tempZipPath, { dir: installPath });
			fs$1.unlinkSync(tempZipPath);
			extensionRegistry.addExtension({
				id: extensionId,
				namespace,
				name,
				version: extInfo.version,
				displayName: extInfo.displayName || name,
				description: extInfo.description || "",
				publisher: extInfo.publisher || namespace,
				installPath,
				iconUrl: extInfo.files.icon || extInfo.iconUrl
			});
		} catch (error) {
			console.error(`Failed to install ${namespace}.${name}:`, error);
			throw error;
		}
	}
	static async uninstall(id) {
		const ext = extensionRegistry.getExtension(id);
		if (!ext) return;
		if (fs$1.existsSync(ext.installPath)) fs$1.rmSync(ext.installPath, {
			recursive: true,
			force: true
		});
		extensionRegistry.removeExtension(id);
	}
};
//#endregion
//#region electron/extensions/ExtensionHostManager.ts
var ExtensionHostManager = class {
	hostProcess = null;
	start() {
		console.log("[ExtensionHost] Starting extension host process skeleton...");
	}
	stop() {
		if (this.hostProcess) {
			this.hostProcess.kill();
			this.hostProcess = null;
		}
	}
};
var extensionHostManager = new ExtensionHostManager();
//#endregion
//#region electron/main.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var require$1 = createRequire$1(import.meta.url);
import_main.default.config({ path: path.join(__dirname, "../.env") });
var pty = require$1("node-pty");
var isDev = process.env.NODE_ENV === "development";
var desktopScheme = "novadesk";
var apiOrigin = process.env.VITE_NOVADESK_API_URL || process.env.NOVADESK_API_URL || "https://novadesk-ide.onrender.com";
var mainWindow = null;
var workspaceRoot = null;
var ptyProcesses = /* @__PURE__ */ new Map();
var terminalSubscribers = /* @__PURE__ */ new Set();
var pendingAuthCallback = null;
var execFileAsync = promisify(execFile);
var aiConnectionPath = () => path.join(app.getPath("userData"), "ai-connection.json");
var readAIConnection = () => {
	try {
		const parsed = JSON.parse(fs.readFileSync(aiConnectionPath(), "utf-8"));
		return {
			provider: parsed.provider === "openai-compatible" ? "openai-compatible" : "novadesk",
			baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl : "",
			model: typeof parsed.model === "string" ? parsed.model : "",
			encryptedApiKey: typeof parsed.encryptedApiKey === "string" ? parsed.encryptedApiKey : void 0
		};
	} catch {
		return {
			provider: "novadesk",
			baseUrl: "",
			model: ""
		};
	}
};
var publicAIConnection = (connection) => ({
	provider: connection.provider,
	baseUrl: connection.baseUrl,
	model: connection.model,
	hasApiKey: Boolean(connection.encryptedApiKey)
});
var getAPIKey = (connection) => {
	if (!connection.encryptedApiKey) return "";
	if (!safeStorage.isEncryptionAvailable()) throw new Error("Your operating system key store is unavailable. NovaDesk cannot safely unlock the AI key.");
	return safeStorage.decryptString(Buffer.from(connection.encryptedApiKey, "base64"));
};
var normalizeAIBaseUrl = (value) => {
	const parsed = new URL(value.trim());
	if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("The AI service URL must begin with http:// or https://.");
	return parsed.toString().replace(/\/$/, "");
};
var isInsideWorkspace = (candidatePath) => {
	if (!workspaceRoot) return false;
	const relative = path.relative(workspaceRoot, path.resolve(candidatePath));
	return relative === "" || !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
};
var ignoredDirectoryNames = /* @__PURE__ */ new Set([
	".git",
	"node_modules",
	".venv",
	"dist",
	"build",
	".next",
	"__pycache__"
]);
var sendTerminalData = (id, data) => {
	for (const subscriber of terminalSubscribers) if (!subscriber.isDestroyed()) subscriber.send("terminal:data", {
		id,
		data
	});
};
var stopTerminal = (id) => {
	const ptyProcess = ptyProcesses.get(id);
	if (ptyProcess) {
		ptyProcess.kill();
		ptyProcesses.delete(id);
	}
};
var createTerminal = (cwd) => {
	const id = randomUUID();
	let shell = "bash";
	if (os.platform() === "win32") shell = "powershell.exe";
	else if (process.env.SHELL) shell = process.env.SHELL;
	const ptyProcess = pty.spawn(shell, [], {
		name: "xterm-color",
		cols: 100,
		rows: 30,
		cwd: cwd || workspaceRoot || process.cwd(),
		env: process.env
	});
	ptyProcess.onData((data) => sendTerminalData(id, data));
	ptyProcess.onExit(() => {
		ptyProcesses.delete(id);
		for (const subscriber of terminalSubscribers) if (!subscriber.isDestroyed()) subscriber.send("terminal:exit", id);
	});
	ptyProcesses.set(id, ptyProcess);
	return id;
};
var runGit = async (args) => {
	if (!workspaceRoot) throw new Error("Open a workspace first.");
	const { stdout, stderr } = await execFileAsync("git", args, {
		cwd: workspaceRoot,
		windowsHide: true,
		maxBuffer: 50 * 1024 * 1024
	});
	return {
		stdout,
		stderr
	};
};
var makeProjectFiles = (template, name) => {
	const packageName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "novadesk-project";
	if (template === "python") return {
		"main.py": "def main():\n    print(\"Hello from NovaDesk!\")\n\n\nif __name__ == \"__main__\":\n    main()\n",
		"README.md": `# ${name}\n\nA Python project created with NovaDesk.\n`,
		".gitignore": "__pycache__/\n.venv/\n.env\n"
	};
	if (template === "html") return {
		"index.html": `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${name}</title>\n    <link rel="stylesheet" href="style.css" />\n  </head>\n  <body>\n    <main>\n      <h1>${name}</h1>\n      <p>Built with NovaDesk.</p>\n    </main>\n    <script src="script.js"><\/script>\n  </body>\n</html>\n`,
		"style.css": "body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #101827; color: #f8fafc; }\nmain { text-align: center; }\n",
		"script.js": "console.log(\"NovaDesk project ready\");\n",
		"README.md": `# ${name}\n\nOpen \`index.html\` in a browser to get started.\n`
	};
	return {
		"package.json": JSON.stringify({
			name: packageName,
			private: true,
			version: "0.1.0",
			type: "module",
			scripts: {
				dev: "vite",
				build: "vite build"
			},
			devDependencies: { vite: "^8.0.0" }
		}, null, 2) + "\n",
		"index.html": "<!doctype html>\n<html lang=\"en\">\n  <head><meta charset=\"UTF-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /><title>NovaDesk App</title></head>\n  <body><div id=\"app\"></div><script type=\"module\" src=\"/src/main.js\"><\/script></body>\n</html>\n",
		"src/main.js": `import './style.css';\n\ndocument.querySelector('#app').innerHTML = \`<main><h1>${name}</h1><p>Your NovaDesk project is ready.</p></main>\`;\n`,
		"src/style.css": "body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Inter, system-ui, sans-serif; background: #0f172a; color: #f8fafc; }\nmain { text-align: center; }\n",
		".gitignore": "node_modules/\ndist/\n.env\n",
		"README.md": `# ${name}\n\nRun \`npm install\` then \`npm run dev\`.\n`
	};
};
var forwardAuthCallback = (urlString) => {
	console.log("[Main Process] forwardAuthCallback called with:", urlString);
	try {
		const url = new URL(urlString);
		if (url.protocol !== `${desktopScheme}:` || url.hostname !== "auth" || url.pathname !== "/callback") {
			console.log("[Main Process] URL is not an auth callback. Ignoring.");
			return;
		}
		const ticket = url.searchParams.get("ticket");
		const state = url.searchParams.get("state");
		const error = url.searchParams.get("error");
		const refresh = url.searchParams.get("refresh");
		console.log("[Main Process] Extracted ticket, state, error, refresh:", {
			ticket,
			state,
			error,
			refresh: !!refresh
		});
		if (error) {
			pendingAuthCallback = {
				ticket: "",
				state: "",
				error
			};
			if (mainWindow) {
				if (mainWindow.isMinimized()) mainWindow.restore();
				mainWindow.show();
				mainWindow.focus();
				mainWindow.webContents.send("auth:callback", pendingAuthCallback);
				pendingAuthCallback = null;
			}
			return;
		}
		if (!ticket || !state) return;
		pendingAuthCallback = {
			ticket,
			state,
			refresh_token: refresh
		};
		if (mainWindow) {
			console.log("[Main Process] mainWindow exists, waking up and sending auth:callback IPC");
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.show();
			mainWindow.focus();
			mainWindow.webContents.send("auth:callback", pendingAuthCallback);
			pendingAuthCallback = null;
		} else console.log("[Main Process] mainWindow does not exist yet. Saved as pending.");
	} catch (err) {
		console.error("[Main Process] Error parsing deep link:", err);
	}
};
function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1440,
		height: 920,
		minWidth: 1e3,
		minHeight: 680,
		titleBarStyle: "hidden",
		titleBarOverlay: {
			color: "#141414",
			symbolColor: "#ffffff",
			height: 32
		},
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: true
		}
	});
	mainWindow.webContents.once("did-finish-load", () => {
		console.log("[Main Process] did-finish-load triggered");
	});
	if (isDev) mainWindow.loadURL("http://localhost:5173");
	else mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}
var setupProtocolHandler = () => {
	if (process.defaultApp && process.argv.length >= 2) app.setAsDefaultProtocolClient(desktopScheme, process.execPath, [path.resolve(process.argv[1])]);
	else app.setAsDefaultProtocolClient(desktopScheme);
};
if (!app.requestSingleInstanceLock()) {
	console.log("[Main Process] Second instance detected. Quitting.");
	app.quit();
} else app.on("second-instance", (_event, commandLine) => {
	console.log("[Main Process] second-instance event fired with args:", commandLine);
	const deepLink = commandLine.find((argument) => argument.startsWith(`${desktopScheme}://`));
	if (deepLink) forwardAuthCallback(deepLink);
});
app.on("open-url", (event, url) => {
	console.log("[Main Process] open-url event fired with:", url);
	event.preventDefault();
	forwardAuthCallback(url);
});
app.whenReady().then(() => {
	setupProtocolHandler();
	createWindow();
	extensionHostManager.start();
	console.log("[Main Process] App ready. Checking process.argv for initial deep link:", process.argv);
	const launchLink = process.argv.find((argument) => argument.startsWith(`${desktopScheme}://`));
	if (launchLink) forwardAuthCallback(launchLink);
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", () => {
	for (const id of ptyProcesses.keys()) stopTerminal(id);
	extensionHostManager.stop();
});
ipcMain.handle("window:control", (event, action) => {
	const window = BrowserWindow.fromWebContents(event.sender);
	if (!window) return;
	if (action === "minimize") window.minimize();
	if (action === "maximize") if (window.isMaximized()) window.unmaximize();
	else window.maximize();
	if (action === "close") window.close();
});
ipcMain.handle("window:setZoom", (event, zoomFactor) => {
	event.sender.setZoomFactor(zoomFactor);
});
ipcMain.handle("window:setTheme", (event, theme) => {
	const window = BrowserWindow.fromWebContents(event.sender);
	if (!window) return;
	let color = "#141414";
	let symbolColor = "#ffffff";
	switch (theme) {
		case "light":
			color = "#f9fafb";
			symbolColor = "#111111";
			break;
		case "abyss":
			color = "#000c18";
			symbolColor = "#6688cc";
			break;
		case "tomorrow-night-blue":
			color = "#002451";
			symbolColor = "#ffffff";
			break;
		case "hc-black":
			color = "#000000";
			symbolColor = "#ffffff";
			break;
		case "hc-light":
			color = "#ffffff";
			symbolColor = "#000000";
			break;
		default:
			color = "#141414";
			symbolColor = "#ffffff";
			break;
	}
	window.setTitleBarOverlay({
		color,
		symbolColor
	});
});
var workspaceWatcher = null;
var startWorkspaceWatcher = (rootPath) => {
	if (workspaceWatcher) {
		workspaceWatcher.close();
		workspaceWatcher = null;
	}
	try {
		workspaceWatcher = fs.watch(rootPath, { recursive: true }, (eventType, filename) => {
			if (filename && mainWindow) mainWindow.webContents.send("workspace:fileChanged", {
				eventType,
				filename,
				fullPath: path.join(rootPath, filename)
			});
		});
	} catch (err) {
		console.error("[Main Process] Failed to start workspace watcher:", err);
	}
};
ipcMain.handle("workspace:openFolder", async () => {
	const { canceled, filePaths } = await (mainWindow ? dialog.showOpenDialog(mainWindow, { properties: ["openDirectory"] }) : dialog.showOpenDialog({ properties: ["openDirectory"] }));
	if (canceled || !filePaths[0]) return null;
	workspaceRoot = path.resolve(filePaths[0]);
	startWorkspaceWatcher(workspaceRoot);
	return workspaceRoot;
});
ipcMain.handle("workspace:setWorkspace", async (_event, rootPath) => {
	if (!rootPath) return { ok: false };
	workspaceRoot = path.resolve(rootPath);
	startWorkspaceWatcher(workspaceRoot);
	return { ok: true };
});
ipcMain.handle("workspace:chooseFolder", async () => {
	const { canceled, filePaths } = await (mainWindow ? dialog.showOpenDialog(mainWindow, { properties: ["openDirectory", "createDirectory"] }) : dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] }));
	return canceled || !filePaths[0] ? null : path.resolve(filePaths[0]);
});
ipcMain.handle("workspace:showSaveDialog", async (_event, defaultPath) => {
	const options = {
		title: "Save As",
		defaultPath
	};
	const { canceled, filePath } = await (mainWindow ? dialog.showSaveDialog(mainWindow, options) : dialog.showSaveDialog(options));
	return canceled || !filePath ? null : path.resolve(filePath);
});
ipcMain.handle("workspace:readDirectory", async (_event, directoryPath) => {
	if (!workspaceRoot) {
		workspaceRoot = path.resolve(directoryPath);
		startWorkspaceWatcher(workspaceRoot);
	}
	if (!isInsideWorkspace(directoryPath)) throw new Error("Directory is outside the active workspace.");
	return fs.readdirSync(directoryPath, { withFileTypes: true }).filter((entry) => !ignoredDirectoryNames.has(entry.name)).map((entry) => ({
		name: entry.name,
		isDirectory: entry.isDirectory(),
		path: path.join(directoryPath, entry.name)
	})).sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name));
});
ipcMain.handle("workspace:readFile", async (_event, filePath) => {
	if (!isInsideWorkspace(filePath)) throw new Error("File is outside the active workspace.");
	return fs.promises.readFile(filePath, "utf-8");
});
ipcMain.handle("workspace:writeFile", async (_event, filePath, content) => {
	if (!isInsideWorkspace(filePath)) throw new Error("File is outside the active workspace.");
	await fs.promises.writeFile(filePath, content, "utf-8");
	return { ok: true };
});
ipcMain.handle("workspace:createFile", async (_event, parentPath, name, content = "") => {
	if (!isInsideWorkspace(parentPath)) throw new Error("Directory is outside the active workspace.");
	const cleanedName = name.trim();
	if (!cleanedName || cleanedName.includes("/") || cleanedName.includes("\\") || cleanedName === "." || cleanedName === "..") throw new Error("Enter a valid file name.");
	const targetPath = path.join(parentPath, cleanedName);
	if (!isInsideWorkspace(targetPath)) throw new Error("File is outside the active workspace.");
	await fs.promises.writeFile(targetPath, content, {
		encoding: "utf-8",
		flag: "wx"
	});
	return targetPath;
});
ipcMain.handle("workspace:createFolder", async (_event, parentPath, name) => {
	if (!isInsideWorkspace(parentPath)) throw new Error("Directory is outside the active workspace.");
	const cleanedName = name.trim();
	if (!cleanedName || cleanedName.includes("/") || cleanedName.includes("\\") || cleanedName === "." || cleanedName === "..") throw new Error("Enter a valid folder name.");
	const targetPath = path.join(parentPath, cleanedName);
	if (!isInsideWorkspace(targetPath)) throw new Error("Folder is outside the active workspace.");
	await fs.promises.mkdir(targetPath);
	return targetPath;
});
ipcMain.handle("workspace:rename", async (_event, oldPath, newName) => {
	if (!isInsideWorkspace(oldPath)) throw new Error("File is outside the active workspace.");
	const cleanedName = newName.trim();
	if (!cleanedName || cleanedName.includes("/") || cleanedName.includes("\\") || cleanedName === "." || cleanedName === "..") throw new Error("Enter a valid name.");
	const parentPath = path.dirname(oldPath);
	const newPath = path.join(parentPath, cleanedName);
	if (!isInsideWorkspace(newPath)) throw new Error("Destination is outside the active workspace.");
	await fs.promises.rename(oldPath, newPath);
	return newPath;
});
ipcMain.handle("workspace:delete", async (_event, targetPath) => {
	if (!isInsideWorkspace(targetPath)) throw new Error("File is outside the active workspace.");
	await fs.promises.rm(targetPath, {
		recursive: true,
		force: true
	});
	return { ok: true };
});
ipcMain.handle("workspace:duplicate", async (_event, targetPath) => {
	if (!isInsideWorkspace(targetPath)) throw new Error("File is outside the active workspace.");
	const ext = path.extname(targetPath);
	const base = path.basename(targetPath, ext);
	const dir = path.dirname(targetPath);
	let newName = `${base} copy${ext}`;
	let newPath = path.join(dir, newName);
	let counter = 1;
	while (fs.existsSync(newPath)) {
		newName = `${base} copy ${counter}${ext}`;
		newPath = path.join(dir, newName);
		counter++;
	}
	if ((await fs.promises.stat(targetPath)).isDirectory()) await fs.promises.cp(targetPath, newPath, { recursive: true });
	else await fs.promises.copyFile(targetPath, newPath);
	return newPath;
});
ipcMain.handle("workspace:reveal", async (_event, targetPath) => {
	if (!isInsideWorkspace(targetPath)) throw new Error("File is outside the active workspace.");
	shell.showItemInFolder(targetPath);
	return { ok: true };
});
ipcMain.handle("workspace:search", async (_event, query) => {
	if (!workspaceRoot) return [];
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) return [];
	const matches = [];
	const visit = async (directoryPath) => {
		if (matches.length >= 200) return;
		const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
		for (const entry of entries) {
			if (matches.length >= 200) break;
			if (ignoredDirectoryNames.has(entry.name)) continue;
			const entryPath = path.join(directoryPath, entry.name);
			if (entry.isDirectory()) {
				await visit(entryPath);
				continue;
			}
			if (!entry.isFile()) continue;
			try {
				if ((await fs.promises.stat(entryPath)).size > 1e6) continue;
				(await fs.promises.readFile(entryPath, "utf-8")).split(/\r?\n/).forEach((line, index) => {
					if (matches.length < 200 && line.toLowerCase().includes(normalizedQuery)) matches.push({
						path: entryPath,
						line: index + 1,
						preview: line.trim().slice(0, 180)
					});
				});
			} catch {}
		}
	};
	await visit(workspaceRoot);
	return matches;
});
ipcMain.handle("workspace:createProject", async (_event, parentDirectory, name, template) => {
	const cleanedName = name.trim();
	if (!cleanedName || /[\\/:*?"<>|]/.test(cleanedName) || cleanedName === "." || cleanedName === "..") throw new Error("Enter a valid project name.");
	const projectRoot = path.join(parentDirectory, cleanedName);
	if (fs.existsSync(projectRoot)) throw new Error("A folder with that name already exists.");
	await fs.promises.mkdir(projectRoot, { recursive: true });
	const files = makeProjectFiles(template, cleanedName);
	await Promise.all(Object.entries(files).map(async ([relativePath, contents]) => {
		const targetPath = path.join(projectRoot, relativePath);
		await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
		await fs.promises.writeFile(targetPath, contents, "utf-8");
	}));
	workspaceRoot = projectRoot;
	startWorkspaceWatcher(workspaceRoot);
	return projectRoot;
});
ipcMain.handle("workspace:cloneRepository", async (_event, repositoryUrl, parentDirectory, name) => {
	const cleanedName = name.trim();
	if (!/^https?:\/\/|^git@/.test(repositoryUrl.trim())) throw new Error("Enter a valid HTTPS or SSH repository URL.");
	if (!cleanedName || /[\\/:*?"<>|]/.test(cleanedName)) throw new Error("Enter a valid folder name.");
	const projectRoot = path.join(parentDirectory, cleanedName);
	if (fs.existsSync(projectRoot)) throw new Error("A folder with that name already exists.");
	await execFileAsync("git", [
		"clone",
		repositoryUrl.trim(),
		projectRoot
	], { windowsHide: true });
	workspaceRoot = projectRoot;
	startWorkspaceWatcher(workspaceRoot);
	return projectRoot;
});
ipcMain.handle("git:status", async () => {
	try {
		const { stdout } = await runGit([
			"status",
			"--porcelain=v1",
			"--branch"
		]);
		return stdout;
	} catch {
		return null;
	}
});
ipcMain.handle("git:init", async () => {
	const { stdout, stderr } = await runGit(["init"]);
	return stdout || stderr || "Initialized empty Git repository.";
});
ipcMain.handle("git:log", async (_event, maxCount) => {
	try {
		const { stdout } = await runGit([
			"log",
			"--pretty=format:%H|%s|%an|%ar",
			"-n",
			(maxCount || 50).toString()
		]);
		return stdout;
	} catch {
		return null;
	}
});
ipcMain.handle("git:branches", async () => {
	try {
		const { stdout } = await runGit(["branch", "-a"]);
		return stdout;
	} catch {
		return null;
	}
});
ipcMain.handle("git:add", async (_event, filePath) => {
	await runGit(["add", filePath]);
	return true;
});
ipcMain.handle("git:unstage", async (_event, filePath) => {
	await runGit([
		"reset",
		"HEAD",
		filePath
	]);
	return true;
});
ipcMain.handle("git:commit", async (_event, message) => {
	try {
		await runGit([
			"commit",
			"-m",
			message
		]);
		return true;
	} catch (error) {
		throw new Error(error.stderr || error.message || "Commit failed");
	}
});
ipcMain.handle("git:remoteAdd", async (_event, url) => {
	try {
		try {
			await runGit([
				"remote",
				"add",
				"origin",
				url
			]);
		} catch (e) {
			if (e.stderr && e.stderr.includes("already exists")) await runGit([
				"remote",
				"set-url",
				"origin",
				url
			]);
			else throw e;
		}
		try {
			await runGit(["fetch", "origin"]);
		} catch (e) {
			console.warn("Fetch failed after remote add:", e.stderr || e.message);
		}
		return true;
	} catch (error) {
		throw new Error(error.stderr || error.message || "Failed to add remote");
	}
});
ipcMain.handle("git:remoteRemove", async () => {
	try {
		await runGit([
			"remote",
			"remove",
			"origin"
		]);
		return true;
	} catch {
		return false;
	}
});
ipcMain.handle("git:remoteUrl", async () => {
	try {
		const { stdout } = await runGit([
			"config",
			"--get",
			"remote.origin.url"
		]);
		return stdout.trim();
	} catch {
		return null;
	}
});
ipcMain.handle("system:openExternal", async (_event, url) => {
	await shell.openExternal(url);
	return true;
});
ipcMain.handle("git:addAll", async () => {
	await runGit(["add", "."]);
	return true;
});
ipcMain.handle("git:diffBranches", async (_event, base, compare) => {
	try {
		const { stdout } = await runGit(["diff", `${base}..${compare}`]);
		return stdout;
	} catch (error) {
		console.error("git diff failed:", error);
		return null;
	}
});
ipcMain.handle("git:push", async (_event, branch) => {
	try {
		await runGit([
			"push",
			"-u",
			"origin",
			branch
		]);
		return true;
	} catch (error) {
		throw new Error(error.stderr || error.message || "Push failed");
	}
});
ipcMain.handle("git:checkout", async (_event, branch, isNew) => {
	try {
		if (isNew) await runGit([
			"checkout",
			"-b",
			branch
		]);
		else await runGit(["checkout", branch]);
		return true;
	} catch (error) {
		throw new Error(error.stderr || error.message || "Checkout failed");
	}
});
ipcMain.handle("git:addFromDialog", async () => {
	if (!mainWindow || !workspaceRoot) return false;
	const result = await dialog.showOpenDialog(mainWindow, {
		title: "Select files or folders to stage",
		properties: [
			"openFile",
			"openDirectory",
			"multiSelections"
		]
	});
	if (!result.canceled && result.filePaths.length > 0) try {
		await runGit(["add", ...result.filePaths]);
		return true;
	} catch (error) {
		throw new Error(error.stderr || error.message || "Add failed");
	}
	return false;
});
ipcMain.handle("ai:getConnection", () => publicAIConnection(readAIConnection()));
ipcMain.handle("ai:saveConnection", (_event, payload) => {
	const previous = readAIConnection();
	const provider = payload.provider === "openai-compatible" ? "openai-compatible" : "novadesk";
	const baseUrl = payload.baseUrl?.trim() ? normalizeAIBaseUrl(payload.baseUrl) : "";
	const model = payload.model?.trim() ?? "";
	if (provider === "openai-compatible" && (!baseUrl || !model)) throw new Error("AI service URL and model are required.");
	let encryptedApiKey = previous.encryptedApiKey;
	if (payload.apiKey?.trim()) {
		if (!safeStorage.isEncryptionAvailable()) throw new Error("Your operating system key store is unavailable, so NovaDesk cannot safely save an AI key.");
		encryptedApiKey = safeStorage.encryptString(payload.apiKey.trim()).toString("base64");
	}
	const connection = {
		provider,
		baseUrl,
		model,
		encryptedApiKey: provider === "openai-compatible" ? encryptedApiKey : void 0
	};
	if (provider === "openai-compatible" && !connection.encryptedApiKey) throw new Error("Enter an API key for the selected AI service.");
	fs.writeFileSync(aiConnectionPath(), JSON.stringify(connection), "utf-8");
	return publicAIConnection(connection);
});
ipcMain.handle("ai:clearConnection", () => {
	try {
		fs.unlinkSync(aiConnectionPath());
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	return publicAIConnection(readAIConnection());
});
ipcMain.handle("ai:testConnection", async () => {
	const connection = readAIConnection();
	if (connection.provider !== "openai-compatible") throw new Error("Select an OpenAI-compatible AI service first.");
	const apiKey = getAPIKey(connection);
	const response = await fetch(`${normalizeAIBaseUrl(connection.baseUrl)}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(body.error?.message ?? body.message ?? `AI service returned ${response.status}.`);
	}
	return {
		ok: true,
		message: `Connected to ${connection.baseUrl}.`
	};
});
ipcMain.handle("ai:chat", async (_event, payload) => {
	const connection = readAIConnection();
	if (connection.provider !== "openai-compatible") throw new Error("No direct AI service is configured.");
	const apiKey = getAPIKey(connection);
	const messages = [{
		role: "system",
		content: payload.context?.activeFile ? `You are NovaDesk, a practical coding assistant. The active file is ${payload.context.activeFile}.\n\n${payload.context.activeFileContent ? `Active file contents:\n${payload.context.activeFileContent.slice(0, 3e4)}` : ""}` : "You are NovaDesk, a practical coding assistant. Help the user build and understand software."
	}, ...payload.messages.slice(-14).map((message) => ({
		role: message.role === "model" ? "assistant" : "user",
		content: message.content
	}))];
	const response = await fetch(`${normalizeAIBaseUrl(connection.baseUrl)}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: connection.model,
			messages,
			stream: false
		})
	});
	const body = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(body.error?.message ?? body.message ?? `AI service returned ${response.status}.`);
	const content = body.choices?.[0]?.message?.content;
	if (!content) throw new Error("The AI service returned an empty response.");
	return {
		content,
		model: connection.model
	};
});
ipcMain.on("terminal:subscribe", (event) => {
	terminalSubscribers.add(event.sender);
	event.sender.once("destroyed", () => terminalSubscribers.delete(event.sender));
});
ipcMain.handle("terminal:create", (_event, cwd) => {
	return createTerminal(cwd);
});
ipcMain.handle("terminal:kill", (_event, id) => {
	stopTerminal(id);
});
ipcMain.on("terminal:write", (_event, id, data) => {
	ptyProcesses.get(id)?.write(data);
});
ipcMain.on("terminal:resize", (_event, id, cols, rows) => {
	if (cols > 0 && rows > 0) ptyProcesses.get(id)?.resize(cols, rows);
});
ipcMain.handle("tasks:spawn", (_event, _command) => {
	return randomUUID();
});
ipcMain.handle("tasks:kill", (_event, _taskId) => {});
ipcMain.handle("auth:startGoogleLogin", async () => {
	console.log("[Main Process] Starting Google Login...");
	const state = randomBytes(32).toString("base64url");
	const url = new URL("/api/auth/google/start", apiOrigin);
	url.searchParams.set("state", state);
	await shell.openExternal(url.toString());
	return state;
});
ipcMain.handle("auth:checkPending", () => {
	console.log("[Main Process] React requested pending auth callback. Current pending:", pendingAuthCallback);
	const payload = pendingAuthCallback;
	pendingAuthCallback = null;
	return payload;
});
var getTokensPath = () => path.join(app.getPath("userData"), "auth_tokens.json");
ipcMain.handle("auth:saveTokens", (_event, tokens) => {
	if (!safeStorage.isEncryptionAvailable()) {
		console.error("safeStorage is not available. Saving unencrypted (not recommended).");
		fs.writeFileSync(getTokensPath(), JSON.stringify(tokens), "utf-8");
		return;
	}
	const data = JSON.stringify(tokens);
	const encrypted = safeStorage.encryptString(data);
	fs.writeFileSync(getTokensPath(), encrypted);
});
ipcMain.handle("auth:getTokens", () => {
	try {
		const data = fs.readFileSync(getTokensPath());
		if (safeStorage.isEncryptionAvailable()) {
			const decrypted = safeStorage.decryptString(data);
			return JSON.parse(decrypted);
		} else return JSON.parse(data.toString("utf-8"));
	} catch {
		return null;
	}
});
ipcMain.handle("auth:clearTokens", () => {
	try {
		fs.unlinkSync(getTokensPath());
	} catch {}
});
var getApiConfigPath = () => path.join(app.getPath("userData"), "api_config.json");
ipcMain.handle("api:saveConfig", (_event, config) => {
	if (!safeStorage.isEncryptionAvailable()) {
		console.warn("safeStorage is not available. Saving API config unencrypted.");
		fs.writeFileSync(getApiConfigPath(), JSON.stringify(config), "utf-8");
		return;
	}
	const data = JSON.stringify(config);
	const encrypted = safeStorage.encryptString(data);
	fs.writeFileSync(getApiConfigPath(), encrypted);
});
ipcMain.handle("api:getConfig", () => {
	try {
		const data = fs.readFileSync(getApiConfigPath());
		if (safeStorage.isEncryptionAvailable()) {
			const decrypted = safeStorage.decryptString(data);
			return JSON.parse(decrypted);
		} else return JSON.parse(data.toString("utf-8"));
	} catch {
		return null;
	}
});
ipcMain.handle("extensions:search", async (_event, query, sortBy, sortOrder, offset) => {
	return OpenVSXClient.search(query, sortBy, sortOrder, offset);
});
ipcMain.handle("extensions:install", async (_event, namespace, name) => {
	await VSIXInstaller.installFromOpenVSX(namespace, name);
});
ipcMain.handle("extensions:uninstall", async (_event, id) => {
	await VSIXInstaller.uninstall(id);
});
ipcMain.handle("extensions:getInstalled", () => {
	return extensionRegistry.getInstalled();
});
ipcMain.handle("extensions:toggle", (_event, id, enabled) => {
	extensionRegistry.toggleExtension(id, enabled);
});
//#endregion
export {};
