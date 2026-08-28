import { createRequire as e } from "node:module";
import { BrowserWindow as t, app as n, dialog as r, ipcMain as i, net as a, safeStorage as o, shell as s } from "electron";
import { randomBytes as c, randomUUID as l } from "crypto";
import { execFile as u } from "child_process";
import { promisify as d } from "util";
import * as f from "fs";
import p from "fs";
import m from "os";
import * as h from "path";
import g from "path";
import { fileURLToPath as _ } from "url";
import { createRequire as ee } from "module";
import v from "extract-zip";
//#region \0rolldown/runtime.js
var y = Object.create, b = Object.defineProperty, x = Object.getOwnPropertyDescriptor, S = Object.getOwnPropertyNames, C = Object.getPrototypeOf, w = Object.prototype.hasOwnProperty, T = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), te = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = S(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !w.call(e, s) && s !== n && b(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = x(t, s)) || r.enumerable
	});
	return e;
}, ne = (e, t, n) => (n = e == null ? {} : y(C(e)), te(t || !e || !e.__esModule ? b(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), E = /* @__PURE__ */ e(import.meta.url), re = /* @__PURE__ */ ne((/* @__PURE__ */ T(((e, t) => {
	var n = E("fs"), r = E("path"), i = E("os"), a = E("crypto"), o = [
		"◈ encrypted .env [www.dotenvx.com]",
		"◈ secrets for agents [www.dotenvx.com]",
		"⌁ auth for agents [www.vestauth.com]",
		"⌘ custom filepath { path: '/custom/path/.env' }",
		"⌘ enable debugging { debug: true }",
		"⌘ override existing { override: true }",
		"⌘ suppress logs { quiet: true }",
		"⌘ multiple files { path: ['.env.local', '.env'] }"
	];
	function s() {
		return o[Math.floor(Math.random() * o.length)];
	}
	function c(e) {
		return typeof e == "string" ? ![
			"false",
			"0",
			"no",
			"off",
			""
		].includes(e.toLowerCase()) : !!e;
	}
	function l() {
		return process.stdout.isTTY;
	}
	function u(e) {
		return l() ? `\x1b[2m${e}\x1b[0m` : e;
	}
	var d = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;
	function f(e) {
		let t = {}, n = e.toString();
		n = n.replace(/\r\n?/gm, "\n");
		let r;
		for (; (r = d.exec(n)) != null;) {
			let e = r[1], n = r[2] || "";
			n = n.trim();
			let i = n[0];
			n = n.replace(/^(['"`])([\s\S]*)\1$/gm, "$2"), i === "\"" && (n = n.replace(/\\n/g, "\n"), n = n.replace(/\\r/g, "\r")), t[e] = n;
		}
		return t;
	}
	function p(e) {
		e ||= {};
		let t = v(e);
		e.path = t;
		let n = T.configDotenv(e);
		if (!n.parsed) {
			let e = /* @__PURE__ */ Error(`MISSING_DATA: Cannot parse ${t} for an unknown reason`);
			throw e.code = "MISSING_DATA", e;
		}
		let r = _(e).split(","), i = r.length, a;
		for (let e = 0; e < i; e++) try {
			let t = ee(n, r[e].trim());
			a = T.decrypt(t.ciphertext, t.key);
			break;
		} catch (t) {
			if (e + 1 >= i) throw t;
		}
		return T.parse(a);
	}
	function m(e) {
		console.error(`⚠ ${e}`);
	}
	function h(e) {
		console.log(`┆ ${e}`);
	}
	function g(e) {
		console.log(`◇ ${e}`);
	}
	function _(e) {
		return e && e.DOTENV_KEY && e.DOTENV_KEY.length > 0 ? e.DOTENV_KEY : process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0 ? process.env.DOTENV_KEY : "";
	}
	function ee(e, t) {
		let n;
		try {
			n = new URL(t);
		} catch (e) {
			if (e.code === "ERR_INVALID_URL") {
				let e = /* @__PURE__ */ Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
				throw e.code = "INVALID_DOTENV_KEY", e;
			}
			throw e;
		}
		let r = n.password;
		if (!r) {
			let e = /* @__PURE__ */ Error("INVALID_DOTENV_KEY: Missing key part");
			throw e.code = "INVALID_DOTENV_KEY", e;
		}
		let i = n.searchParams.get("environment");
		if (!i) {
			let e = /* @__PURE__ */ Error("INVALID_DOTENV_KEY: Missing environment part");
			throw e.code = "INVALID_DOTENV_KEY", e;
		}
		let a = `DOTENV_VAULT_${i.toUpperCase()}`, o = e.parsed[a];
		if (!o) {
			let e = /* @__PURE__ */ Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${a} in your .env.vault file.`);
			throw e.code = "NOT_FOUND_DOTENV_ENVIRONMENT", e;
		}
		return {
			ciphertext: o,
			key: r
		};
	}
	function v(e) {
		let t = null;
		if (e && e.path && e.path.length > 0) if (Array.isArray(e.path)) for (let r of e.path) n.existsSync(r) && (t = r.endsWith(".vault") ? r : `${r}.vault`);
		else t = e.path.endsWith(".vault") ? e.path : `${e.path}.vault`;
		else t = r.resolve(process.cwd(), ".env.vault");
		return n.existsSync(t) ? t : null;
	}
	function y(e) {
		return e[0] === "~" ? r.join(i.homedir(), e.slice(1)) : e;
	}
	function b(e) {
		let t = c(process.env.DOTENV_CONFIG_DEBUG || e && e.debug), n = c(process.env.DOTENV_CONFIG_QUIET || e && e.quiet);
		(t || !n) && g("loading env from encrypted .env.vault");
		let r = T._parseVault(e), i = process.env;
		return e && e.processEnv != null && (i = e.processEnv), T.populate(i, r, e), { parsed: r };
	}
	function x(e) {
		let t = r.resolve(process.cwd(), ".env"), i = "utf8", a = process.env;
		e && e.processEnv != null && (a = e.processEnv);
		let o = c(a.DOTENV_CONFIG_DEBUG || e && e.debug), l = c(a.DOTENV_CONFIG_QUIET || e && e.quiet);
		e && e.encoding ? i = e.encoding : o && h("no encoding is specified (UTF-8 is used by default)");
		let d = [t];
		if (e && e.path) if (!Array.isArray(e.path)) d = [y(e.path)];
		else {
			d = [];
			for (let t of e.path) d.push(y(t));
		}
		let f, p = {};
		for (let t of d) try {
			let r = T.parse(n.readFileSync(t, { encoding: i }));
			T.populate(p, r, e);
		} catch (e) {
			o && h(`failed to load ${t} ${e.message}`), f = e;
		}
		let m = T.populate(a, p, e);
		if (o = c(a.DOTENV_CONFIG_DEBUG || o), l = c(a.DOTENV_CONFIG_QUIET || l), o || !l) {
			let e = Object.keys(m).length, t = [];
			for (let e of d) try {
				let n = r.relative(process.cwd(), e);
				t.push(n);
			} catch (t) {
				o && h(`failed to load ${e} ${t.message}`), f = t;
			}
			g(`injected env (${e}) from ${t.join(",")} ${u(`// tip: ${s()}`)}`);
		}
		return f ? {
			parsed: p,
			error: f
		} : { parsed: p };
	}
	function S(e) {
		if (_(e).length === 0) return T.configDotenv(e);
		let t = v(e);
		return t ? T._configVault(e) : (m(`you set DOTENV_KEY but you are missing a .env.vault file at ${t}`), T.configDotenv(e));
	}
	function C(e, t) {
		let n = Buffer.from(t.slice(-64), "hex"), r = Buffer.from(e, "base64"), i = r.subarray(0, 12), o = r.subarray(-16);
		r = r.subarray(12, -16);
		try {
			let e = a.createDecipheriv("aes-256-gcm", n, i);
			return e.setAuthTag(o), `${e.update(r)}${e.final()}`;
		} catch (e) {
			let t = e instanceof RangeError, n = e.message === "Invalid key length", r = e.message === "Unsupported state or unable to authenticate data";
			if (t || n) {
				let e = /* @__PURE__ */ Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
				throw e.code = "INVALID_DOTENV_KEY", e;
			} else if (r) {
				let e = /* @__PURE__ */ Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
				throw e.code = "DECRYPTION_FAILED", e;
			} else throw e;
		}
	}
	function w(e, t, n = {}) {
		let r = !!(n && n.debug), i = !!(n && n.override), a = {};
		if (typeof t != "object") {
			let e = /* @__PURE__ */ Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
			throw e.code = "OBJECT_REQUIRED", e;
		}
		for (let n of Object.keys(t)) Object.prototype.hasOwnProperty.call(e, n) ? (i === !0 && (e[n] = t[n], a[n] = t[n]), r && h(i === !0 ? `"${n}" is already defined and WAS overwritten` : `"${n}" is already defined and was NOT overwritten`)) : (e[n] = t[n], a[n] = t[n]);
		return a;
	}
	var T = {
		configDotenv: x,
		_configVault: b,
		_parseVault: p,
		config: S,
		decrypt: C,
		parse: f,
		populate: w
	};
	t.exports.configDotenv = T.configDotenv, t.exports._configVault = T._configVault, t.exports._parseVault = T._parseVault, t.exports.config = T.config, t.exports.decrypt = T.decrypt, t.exports.parse = T.parse, t.exports.populate = T.populate, t.exports = T;
})))(), 1), D = class {
	static BASE_URL = "https://open-vsx.org/api";
	static async search(e = "", t = "downloadCount", n = "desc", r = 0, i = 20) {
		let o = `${this.BASE_URL}/-/search?query=${encodeURIComponent(e)}&sortBy=${t}&sortOrder=${n}&offset=${r}&size=${i}`;
		return new Promise((e, t) => {
			let n = a.request(o);
			n.on("response", (n) => {
				if (n.statusCode !== 200) {
					t(/* @__PURE__ */ Error(`Open VSX API returned status ${n.statusCode}`));
					return;
				}
				let r = "";
				n.on("data", (e) => {
					r += e.toString();
				}), n.on("end", () => {
					try {
						e(JSON.parse(r));
					} catch {
						t(/* @__PURE__ */ Error("Failed to parse Open VSX response"));
					}
				});
			}), n.on("error", (e) => {
				t(e);
			}), n.end();
		});
	}
	static async getExtension(e, t) {
		let n = `${this.BASE_URL}/${encodeURIComponent(e)}/${encodeURIComponent(t)}`;
		return new Promise((e, t) => {
			let r = a.request(n);
			r.on("response", (n) => {
				if (n.statusCode !== 200) {
					t(/* @__PURE__ */ Error(`Open VSX API returned status ${n.statusCode}`));
					return;
				}
				let r = "";
				n.on("data", (e) => {
					r += e.toString();
				}), n.on("end", () => {
					try {
						e(JSON.parse(r));
					} catch {
						t(/* @__PURE__ */ Error("Failed to parse Open VSX response"));
					}
				});
			}), r.on("error", (e) => {
				t(e);
			}), r.end();
		});
	}
}, O = new class {
	registryPath;
	installedExtensions;
	constructor() {
		let e = n.getPath("userData");
		this.registryPath = h.join(e, "extensions.json"), this.installedExtensions = /* @__PURE__ */ new Map(), this.load();
	}
	load() {
		if (f.existsSync(this.registryPath)) try {
			let e = f.readFileSync(this.registryPath, "utf8");
			JSON.parse(e).forEach((e) => this.installedExtensions.set(e.id, e));
		} catch (e) {
			console.error("Failed to load extension registry", e);
		}
	}
	save() {
		try {
			let e = Array.from(this.installedExtensions.values());
			f.writeFileSync(this.registryPath, JSON.stringify(e, null, 2), "utf8");
		} catch (e) {
			console.error("Failed to save extension registry", e);
		}
	}
	getInstalled() {
		return Array.from(this.installedExtensions.values());
	}
	getExtension(e) {
		return this.installedExtensions.get(e);
	}
	addExtension(e) {
		this.installedExtensions.set(e.id, {
			...e,
			enabled: !0,
			installedAt: Date.now()
		}), this.save();
	}
	removeExtension(e) {
		this.installedExtensions.has(e) && (this.installedExtensions.delete(e), this.save());
	}
	toggleExtension(e, t) {
		let n = this.installedExtensions.get(e);
		n && (n.enabled = t, this.save());
	}
}(), k = class {
	static extensionsDir = h.join(n.getPath("userData"), "extensions");
	static ensureDir(e) {
		f.existsSync(e) || f.mkdirSync(e, { recursive: !0 });
	}
	static async installFromOpenVSX(e, t) {
		try {
			let n = await D.getExtension(e, t), r = n.files.download, i = `${e}.${t}`;
			this.ensureDir(this.extensionsDir);
			let o = h.join(this.extensionsDir, i), s = h.join(this.extensionsDir, `${i}.temp.vsix`);
			await new Promise((e, t) => {
				let n = a.request(r), i = f.createWriteStream(s);
				n.on("response", (n) => {
					if (n.statusCode !== 200) {
						t(/* @__PURE__ */ Error(`Failed to download extension: HTTP ${n.statusCode}`));
						return;
					}
					n.on("data", (e) => {
						i.write(e);
					}), n.on("end", () => {
						i.end(), e();
					});
				}), n.on("error", (e) => {
					i.close(), f.unlinkSync(s), t(e);
				}), n.end();
			}), f.existsSync(o) && f.rmSync(o, {
				recursive: !0,
				force: !0
			}), await v(s, { dir: o }), f.unlinkSync(s), O.addExtension({
				id: i,
				namespace: e,
				name: t,
				version: n.version,
				displayName: n.displayName || t,
				description: n.description || "",
				publisher: n.publisher || e,
				installPath: o,
				iconUrl: n.files.icon || n.iconUrl
			});
		} catch (n) {
			throw console.error(`Failed to install ${e}.${t}:`, n), n;
		}
	}
	static async uninstall(e) {
		let t = O.getExtension(e);
		t && (f.existsSync(t.installPath) && f.rmSync(t.installPath, {
			recursive: !0,
			force: !0
		}), O.removeExtension(e));
	}
}, A = new class {
	hostProcess = null;
	start() {
		console.log("[ExtensionHost] Starting extension host process skeleton...");
	}
	stop() {
		this.hostProcess &&= (this.hostProcess.kill(), null);
	}
}(), j = g.dirname(_(import.meta.url)), ie = ee(import.meta.url);
re.default.config({ path: g.join(j, "../.env") });
var ae = ie("node-pty"), oe = process.env.NODE_ENV === "development", M = "novadesk", se = process.env.VITE_NOVADESK_API_URL || process.env.NOVADESK_API_URL || "https://novadesk-ide.onrender.com", N = null, P = null, F = /* @__PURE__ */ new Map(), I = /* @__PURE__ */ new Set(), L = null, R = d(u), z = () => g.join(n.getPath("userData"), "ai-connection.json"), B = () => {
	try {
		let e = JSON.parse(p.readFileSync(z(), "utf-8"));
		return {
			provider: e.provider === "openai-compatible" ? "openai-compatible" : "novadesk",
			baseUrl: typeof e.baseUrl == "string" ? e.baseUrl : "",
			model: typeof e.model == "string" ? e.model : "",
			encryptedApiKey: typeof e.encryptedApiKey == "string" ? e.encryptedApiKey : void 0
		};
	} catch {
		return {
			provider: "novadesk",
			baseUrl: "",
			model: ""
		};
	}
}, V = (e) => ({
	provider: e.provider,
	baseUrl: e.baseUrl,
	model: e.model,
	hasApiKey: !!e.encryptedApiKey
}), H = (e) => {
	if (!e.encryptedApiKey) return "";
	if (!o.isEncryptionAvailable()) throw Error("Your operating system key store is unavailable. NovaDesk cannot safely unlock the AI key.");
	return o.decryptString(Buffer.from(e.encryptedApiKey, "base64"));
}, U = (e) => {
	let t = new URL(e.trim());
	if (!["http:", "https:"].includes(t.protocol)) throw Error("The AI service URL must begin with http:// or https://.");
	return t.toString().replace(/\/$/, "");
}, W = (e) => {
	if (!P) return !0;
	let t = g.resolve(e), n = g.resolve(P);
	if (process.platform === "win32") {
		let e = g.relative(n.toLowerCase(), t.toLowerCase());
		return e === "" || !e.startsWith(`..${g.sep}`) && e !== ".." && !g.isAbsolute(e);
	}
	let r = g.relative(n, t);
	return r === "" || !r.startsWith(`..${g.sep}`) && r !== ".." && !g.isAbsolute(r);
}, G = /* @__PURE__ */ new Set([
	".git",
	"node_modules",
	".venv",
	"dist",
	"build",
	".next",
	"__pycache__"
]), ce = (e, t) => {
	for (let n of I) n.isDestroyed() || n.send("terminal:data", {
		id: e,
		data: t
	});
}, K = (e) => {
	let t = F.get(e);
	t && (t.kill(), F.delete(e));
}, le = (e) => {
	let t = l(), n = "bash";
	m.platform() === "win32" ? n = "powershell.exe" : process.env.SHELL && (n = process.env.SHELL);
	let r = ae.spawn(n, [], {
		name: "xterm-color",
		cols: 100,
		rows: 30,
		cwd: e || P || process.cwd(),
		env: process.env
	});
	return r.onData((e) => ce(t, e)), r.onExit(() => {
		F.delete(t);
		for (let e of I) e.isDestroyed() || e.send("terminal:exit", t);
	}), F.set(t, r), t;
}, q = async (e) => {
	if (!P) throw Error("Open a workspace first.");
	let { stdout: t, stderr: n } = await R("git", e, {
		cwd: P,
		windowsHide: !0,
		maxBuffer: 50 * 1024 * 1024
	});
	return {
		stdout: t,
		stderr: n
	};
}, ue = (e, t) => {
	let n = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "novadesk-project";
	return e === "python" ? {
		"main.py": "def main():\n    print(\"Hello from NovaDesk!\")\n\n\nif __name__ == \"__main__\":\n    main()\n",
		"README.md": `# ${t}\n\nA Python project created with NovaDesk.\n`,
		".gitignore": "__pycache__/\n.venv/\n.env\n"
	} : e === "html" ? {
		"index.html": `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${t}</title>\n    <link rel="stylesheet" href="style.css" />\n  </head>\n  <body>\n    <main>\n      <h1>${t}</h1>\n      <p>Built with NovaDesk.</p>\n    </main>\n    <script src="script.js"><\/script>\n  </body>\n</html>\n`,
		"style.css": "body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #101827; color: #f8fafc; }\nmain { text-align: center; }\n",
		"script.js": "console.log(\"NovaDesk project ready\");\n",
		"README.md": `# ${t}\n\nOpen \`index.html\` in a browser to get started.\n`
	} : {
		"package.json": JSON.stringify({
			name: n,
			private: !0,
			version: "0.1.0",
			type: "module",
			scripts: {
				dev: "vite",
				build: "vite build"
			},
			devDependencies: { vite: "^8.0.0" }
		}, null, 2) + "\n",
		"index.html": "<!doctype html>\n<html lang=\"en\">\n  <head><meta charset=\"UTF-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /><title>NovaDesk App</title></head>\n  <body><div id=\"app\"></div><script type=\"module\" src=\"/src/main.js\"><\/script></body>\n</html>\n",
		"src/main.js": `import './style.css';\n\ndocument.querySelector('#app').innerHTML = \`<main><h1>${t}</h1><p>Your NovaDesk project is ready.</p></main>\`;\n`,
		"src/style.css": "body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Inter, system-ui, sans-serif; background: #0f172a; color: #f8fafc; }\nmain { text-align: center; }\n",
		".gitignore": "node_modules/\ndist/\n.env\n",
		"README.md": `# ${t}\n\nRun \`npm install\` then \`npm run dev\`.\n`
	};
}, J = (e) => {
	console.log("[Main Process] forwardAuthCallback called with:", e);
	try {
		let t = new URL(e);
		if (t.protocol !== `${M}:` || t.hostname !== "auth" || t.pathname !== "/callback") {
			console.log("[Main Process] URL is not an auth callback. Ignoring.");
			return;
		}
		let n = t.searchParams.get("ticket"), r = t.searchParams.get("state"), i = t.searchParams.get("error"), a = t.searchParams.get("refresh");
		if (console.log("[Main Process] Extracted ticket, state, error, refresh:", {
			ticket: n,
			state: r,
			error: i,
			refresh: !!a
		}), i) {
			L = {
				ticket: "",
				state: "",
				error: i
			}, N && (N.isMinimized() && N.restore(), N.show(), N.focus(), N.webContents.send("auth:callback", L), L = null);
			return;
		}
		if (!n || !r) return;
		L = {
			ticket: n,
			state: r,
			refresh_token: a
		}, N ? (console.log("[Main Process] mainWindow exists, waking up and sending auth:callback IPC"), N.isMinimized() && N.restore(), N.show(), N.focus(), N.webContents.send("auth:callback", L), L = null) : console.log("[Main Process] mainWindow does not exist yet. Saved as pending.");
	} catch (e) {
		console.error("[Main Process] Error parsing deep link:", e);
	}
};
function Y() {
	N = new t({
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
			preload: g.join(j, "preload.mjs"),
			nodeIntegration: !1,
			contextIsolation: !0,
			sandbox: !0
		}
	}), N.webContents.once("did-finish-load", () => {
		console.log("[Main Process] did-finish-load triggered");
	}), oe ? N.loadURL("http://localhost:5173") : N.loadFile(g.join(j, "../dist/index.html"));
}
var de = () => {
	process.defaultApp && process.argv.length >= 2 ? n.setAsDefaultProtocolClient(M, process.execPath, [g.resolve(process.argv[1])]) : n.setAsDefaultProtocolClient(M);
};
n.requestSingleInstanceLock() ? n.on("second-instance", (e, t) => {
	console.log("[Main Process] second-instance event fired with args:", t);
	let n = t.find((e) => e.startsWith(`${M}://`));
	n && J(n);
}) : (console.log("[Main Process] Second instance detected. Quitting."), n.quit()), n.on("open-url", (e, t) => {
	console.log("[Main Process] open-url event fired with:", t), e.preventDefault(), J(t);
}), n.whenReady().then(() => {
	de(), Y(), A.start(), console.log("[Main Process] App ready. Checking process.argv for initial deep link:", process.argv);
	let e = process.argv.find((e) => e.startsWith(`${M}://`));
	e && J(e), n.on("activate", () => {
		t.getAllWindows().length === 0 && Y();
	});
}), n.on("window-all-closed", () => {
	process.platform !== "darwin" && n.quit();
}), n.on("before-quit", () => {
	for (let e of F.keys()) K(e);
	A.stop();
}), i.handle("window:control", (e, n) => {
	let r = t.fromWebContents(e.sender);
	r && (n === "minimize" && r.minimize(), n === "maximize" && (r.isMaximized() ? r.unmaximize() : r.maximize()), n === "close" && r.close());
}), i.handle("window:setZoom", (e, t) => {
	e.sender.setZoomFactor(t);
}), i.handle("window:setTheme", (e, n) => {
	let r = t.fromWebContents(e.sender);
	if (!r) return;
	let i = "#141414", a = "#ffffff";
	switch (n) {
		case "light":
			i = "#f9fafb", a = "#111111";
			break;
		case "abyss":
			i = "#000c18", a = "#6688cc";
			break;
		case "tomorrow-night-blue":
			i = "#002451", a = "#ffffff";
			break;
		case "hc-black":
			i = "#000000", a = "#ffffff";
			break;
		case "hc-light":
			i = "#ffffff", a = "#000000";
			break;
		default:
			i = "#141414", a = "#ffffff";
			break;
	}
	r.setTitleBarOverlay({
		color: i,
		symbolColor: a
	});
});
var X = null, Z = (e) => {
	X &&= (X.close(), null);
	try {
		X = p.watch(e, { recursive: !0 }, (t, n) => {
			n && N && N.webContents.send("workspace:fileChanged", {
				eventType: t,
				filename: n,
				fullPath: g.join(e, n)
			});
		});
	} catch (e) {
		console.error("[Main Process] Failed to start workspace watcher:", e);
	}
};
i.handle("workspace:openFolder", async () => {
	let { canceled: e, filePaths: t } = await (N ? r.showOpenDialog(N, { properties: ["openDirectory"] }) : r.showOpenDialog({ properties: ["openDirectory"] }));
	return e || !t[0] ? null : (P = g.resolve(t[0]), Z(P), P);
}), i.handle("workspace:setWorkspace", async (e, t) => t ? (P = g.resolve(t), Z(P), { ok: !0 }) : { ok: !1 }), i.handle("workspace:chooseFolder", async () => {
	let { canceled: e, filePaths: t } = await (N ? r.showOpenDialog(N, { properties: ["openDirectory", "createDirectory"] }) : r.showOpenDialog({ properties: ["openDirectory", "createDirectory"] }));
	return e || !t[0] ? null : g.resolve(t[0]);
}), i.handle("workspace:showSaveDialog", async (e, t) => {
	let n = {
		title: "Save As",
		defaultPath: t
	}, { canceled: i, filePath: a } = await (N ? r.showSaveDialog(N, n) : r.showSaveDialog(n));
	return i || !a ? null : g.resolve(a);
}), i.handle("workspace:readDirectory", async (e, t) => {
	if (P || (P = g.resolve(t), Z(P)), !W(t)) throw Error("Directory is outside the active workspace.");
	return p.readdirSync(t, { withFileTypes: !0 }).filter((e) => !G.has(e.name)).map((e) => ({
		name: e.name,
		isDirectory: e.isDirectory(),
		path: g.join(t, e.name)
	})).sort((e, t) => Number(t.isDirectory) - Number(e.isDirectory) || e.name.localeCompare(t.name));
}), i.handle("workspace:readFile", async (e, t) => {
	if (!W(t)) throw Error("File is outside the active workspace.");
	return p.promises.readFile(t, "utf-8");
}), i.handle("workspace:writeFile", async (e, t, n) => {
	if (!W(t)) throw Error("File is outside the active workspace.");
	return await p.promises.writeFile(t, n, "utf-8"), { ok: !0 };
}), i.handle("workspace:createFile", async (e, t, n, r = "") => {
	if (!W(t)) throw Error("Directory is outside the active workspace.");
	let i = n.trim();
	if (!i || i.includes("/") || i.includes("\\") || i === "." || i === "..") throw Error("Enter a valid file name.");
	let a = g.join(t, i);
	if (!W(a)) throw Error("File is outside the active workspace.");
	return await p.promises.writeFile(a, r, {
		encoding: "utf-8",
		flag: "wx"
	}), a;
}), i.handle("workspace:createFolder", async (e, t, n) => {
	if (!W(t)) throw Error("Directory is outside the active workspace.");
	let r = n.trim();
	if (!r || r.includes("/") || r.includes("\\") || r === "." || r === "..") throw Error("Enter a valid folder name.");
	let i = g.join(t, r);
	if (!W(i)) throw Error("Folder is outside the active workspace.");
	return await p.promises.mkdir(i), i;
}), i.handle("workspace:rename", async (e, t, n) => {
	if (!W(t)) throw Error("File is outside the active workspace.");
	let r = n.trim();
	if (!r || r.includes("/") || r.includes("\\") || r === "." || r === "..") throw Error("Enter a valid name.");
	let i = g.dirname(t), a = g.join(i, r);
	if (!W(a)) throw Error("Destination is outside the active workspace.");
	return await p.promises.rename(t, a), a;
}), i.handle("workspace:delete", async (e, t) => {
	if (!W(t)) throw Error("File is outside the active workspace.");
	return await p.promises.rm(t, {
		recursive: !0,
		force: !0
	}), { ok: !0 };
}), i.handle("workspace:duplicate", async (e, t) => {
	if (!W(t)) throw Error("File is outside the active workspace.");
	let n = g.extname(t), r = g.basename(t, n), i = g.dirname(t), a = `${r} copy${n}`, o = g.join(i, a), s = 1;
	for (; p.existsSync(o);) a = `${r} copy ${s}${n}`, o = g.join(i, a), s++;
	return (await p.promises.stat(t)).isDirectory() ? await p.promises.cp(t, o, { recursive: !0 }) : await p.promises.copyFile(t, o), o;
}), i.handle("workspace:reveal", async (e, t) => {
	if (!W(t)) throw Error("File is outside the active workspace.");
	return s.showItemInFolder(t), { ok: !0 };
}), i.handle("workspace:search", async (e, t) => {
	if (!P) return [];
	let n = t.trim().toLowerCase();
	if (!n) return [];
	let r = [], i = async (e) => {
		if (r.length >= 200) return;
		let t = await p.promises.readdir(e, { withFileTypes: !0 });
		for (let a of t) {
			if (r.length >= 200) break;
			if (G.has(a.name)) continue;
			let t = g.join(e, a.name);
			if (a.isDirectory()) {
				await i(t);
				continue;
			}
			if (a.isFile()) try {
				if ((await p.promises.stat(t)).size > 1e6) continue;
				(await p.promises.readFile(t, "utf-8")).split(/\r?\n/).forEach((e, i) => {
					r.length < 200 && e.toLowerCase().includes(n) && r.push({
						path: t,
						line: i + 1,
						preview: e.trim().slice(0, 180)
					});
				});
			} catch {}
		}
	};
	return await i(P), r;
}), i.handle("workspace:createProject", async (e, t, n, r) => {
	let i = n.trim();
	if (!i || /[\\/:*?"<>|]/.test(i) || i === "." || i === "..") throw Error("Enter a valid project name.");
	let a = g.join(t, i);
	if (p.existsSync(a)) throw Error("A folder with that name already exists.");
	await p.promises.mkdir(a, { recursive: !0 });
	let o = ue(r, i);
	return await Promise.all(Object.entries(o).map(async ([e, t]) => {
		let n = g.join(a, e);
		await p.promises.mkdir(g.dirname(n), { recursive: !0 }), await p.promises.writeFile(n, t, "utf-8");
	})), P = a, Z(P), a;
}), i.handle("workspace:cloneRepository", async (e, t, n, r) => {
	let i = r.trim();
	if (!/^https?:\/\/|^git@/.test(t.trim())) throw Error("Enter a valid HTTPS or SSH repository URL.");
	if (!i || /[\\/:*?"<>|]/.test(i)) throw Error("Enter a valid folder name.");
	let a = g.join(n, i);
	if (p.existsSync(a)) throw Error("A folder with that name already exists.");
	return await R("git", [
		"clone",
		t.trim(),
		a
	], { windowsHide: !0 }), P = a, Z(P), a;
}), i.handle("git:status", async () => {
	try {
		let { stdout: e } = await q([
			"status",
			"--porcelain=v1",
			"--branch"
		]);
		return e;
	} catch {
		return null;
	}
}), i.handle("git:init", async () => {
	let { stdout: e, stderr: t } = await q(["init"]);
	return e || t || "Initialized empty Git repository.";
}), i.handle("git:log", async (e, t) => {
	try {
		let { stdout: e } = await q([
			"log",
			"--pretty=format:%H|%s|%an|%ar",
			"-n",
			(t || 50).toString()
		]);
		return e;
	} catch {
		return null;
	}
}), i.handle("git:branches", async () => {
	try {
		let { stdout: e } = await q(["branch", "-a"]);
		return e;
	} catch {
		return null;
	}
}), i.handle("git:add", async (e, t) => (await q(["add", t]), !0)), i.handle("git:unstage", async (e, t) => (await q([
	"reset",
	"HEAD",
	t
]), !0)), i.handle("git:commit", async (e, t) => {
	try {
		return await q([
			"commit",
			"-m",
			t
		]), !0;
	} catch (e) {
		throw Error(e.stderr || e.message || "Commit failed");
	}
}), i.handle("git:remoteAdd", async (e, t) => {
	try {
		try {
			await q([
				"remote",
				"add",
				"origin",
				t
			]);
		} catch (e) {
			if (e.stderr && e.stderr.includes("already exists")) await q([
				"remote",
				"set-url",
				"origin",
				t
			]);
			else throw e;
		}
		try {
			await q(["fetch", "origin"]);
		} catch (e) {
			console.warn("Fetch failed after remote add:", e.stderr || e.message);
		}
		return !0;
	} catch (e) {
		throw Error(e.stderr || e.message || "Failed to add remote");
	}
}), i.handle("git:remoteRemove", async () => {
	try {
		return await q([
			"remote",
			"remove",
			"origin"
		]), !0;
	} catch {
		return !1;
	}
}), i.handle("git:remoteUrl", async () => {
	try {
		let { stdout: e } = await q([
			"config",
			"--get",
			"remote.origin.url"
		]);
		return e.trim();
	} catch {
		return null;
	}
}), i.handle("system:openExternal", async (e, t) => (await s.openExternal(t), !0)), i.handle("git:addAll", async () => (await q(["add", "."]), !0)), i.handle("git:diffBranches", async (e, t, n) => {
	try {
		let { stdout: e } = await q(["diff", `${t}..${n}`]);
		return e;
	} catch (e) {
		return console.error("git diff failed:", e), null;
	}
}), i.handle("git:push", async (e, t) => {
	try {
		return await q([
			"push",
			"-u",
			"origin",
			t
		]), !0;
	} catch (e) {
		throw Error(e.stderr || e.message || "Push failed");
	}
}), i.handle("git:checkout", async (e, t, n) => {
	try {
		return n ? await q([
			"checkout",
			"-b",
			t
		]) : await q(["checkout", t]), !0;
	} catch (e) {
		throw Error(e.stderr || e.message || "Checkout failed");
	}
}), i.handle("git:addFromDialog", async () => {
	if (!N || !P) return !1;
	let e = await r.showOpenDialog(N, {
		title: "Select files or folders to stage",
		properties: [
			"openFile",
			"openDirectory",
			"multiSelections"
		]
	});
	if (!e.canceled && e.filePaths.length > 0) try {
		return await q(["add", ...e.filePaths]), !0;
	} catch (e) {
		throw Error(e.stderr || e.message || "Add failed");
	}
	return !1;
}), i.handle("ai:getConnection", () => V(B())), i.handle("ai:saveConnection", (e, t) => {
	let n = B(), r = t.provider === "openai-compatible" ? "openai-compatible" : "novadesk", i = t.baseUrl?.trim() ? U(t.baseUrl) : "", a = t.model?.trim() ?? "";
	if (r === "openai-compatible" && (!i || !a)) throw Error("AI service URL and model are required.");
	let s = n.encryptedApiKey;
	if (t.apiKey?.trim()) {
		if (!o.isEncryptionAvailable()) throw Error("Your operating system key store is unavailable, so NovaDesk cannot safely save an AI key.");
		s = o.encryptString(t.apiKey.trim()).toString("base64");
	}
	let c = {
		provider: r,
		baseUrl: i,
		model: a,
		encryptedApiKey: r === "openai-compatible" ? s : void 0
	};
	if (r === "openai-compatible" && !c.encryptedApiKey) throw Error("Enter an API key for the selected AI service.");
	return p.writeFileSync(z(), JSON.stringify(c), "utf-8"), V(c);
}), i.handle("ai:clearConnection", () => {
	try {
		p.unlinkSync(z());
	} catch (e) {
		if (e.code !== "ENOENT") throw e;
	}
	return V(B());
}), i.handle("ai:testConnection", async () => {
	let e = B();
	if (e.provider !== "openai-compatible") throw Error("Select an OpenAI-compatible AI service first.");
	let t = H(e), n = await fetch(`${U(e.baseUrl)}/models`, { headers: { Authorization: `Bearer ${t}` } });
	if (!n.ok) {
		let e = await n.json().catch(() => ({}));
		throw Error(e.error?.message ?? e.message ?? `AI service returned ${n.status}.`);
	}
	return {
		ok: !0,
		message: `Connected to ${e.baseUrl}.`
	};
}), i.handle("ai:chat", async (e, t) => {
	let n = B();
	if (n.provider !== "openai-compatible") throw Error("No direct AI service is configured.");
	let r = H(n), i = [{
		role: "system",
		content: t.context?.activeFile ? `You are NovaDesk, a practical coding assistant. The active file is ${t.context.activeFile}.\n\n${t.context.activeFileContent ? `Active file contents:\n${t.context.activeFileContent.slice(0, 3e4)}` : ""}` : "You are NovaDesk, a practical coding assistant. Help the user build and understand software."
	}, ...t.messages.slice(-14).map((e) => ({
		role: e.role === "model" ? "assistant" : "user",
		content: e.content
	}))], a = await fetch(`${U(n.baseUrl)}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${r}`
		},
		body: JSON.stringify({
			model: n.model,
			messages: i,
			stream: !1
		})
	}), o = await a.json().catch(() => ({}));
	if (!a.ok) throw Error(o.error?.message ?? o.message ?? `AI service returned ${a.status}.`);
	let s = o.choices?.[0]?.message?.content;
	if (!s) throw Error("The AI service returned an empty response.");
	return {
		content: s,
		model: n.model
	};
}), i.on("terminal:subscribe", (e) => {
	I.add(e.sender), e.sender.once("destroyed", () => I.delete(e.sender));
}), i.handle("terminal:create", (e, t) => le(t)), i.handle("terminal:kill", (e, t) => {
	K(t);
}), i.on("terminal:write", (e, t, n) => {
	F.get(t)?.write(n);
}), i.on("terminal:resize", (e, t, n, r) => {
	n > 0 && r > 0 && F.get(t)?.resize(n, r);
}), i.handle("tasks:spawn", (e, t) => l()), i.handle("tasks:kill", (e, t) => {}), i.handle("auth:startGoogleLogin", async () => {
	console.log("[Main Process] Starting Google Login...");
	let e = c(32).toString("base64url"), t = new URL("/api/auth/google/start", se);
	return t.searchParams.set("state", e), await s.openExternal(t.toString()), e;
}), i.handle("auth:checkPending", () => {
	console.log("[Main Process] React requested pending auth callback. Current pending:", L);
	let e = L;
	return L = null, e;
});
var Q = () => g.join(n.getPath("userData"), "auth_tokens.json");
i.handle("auth:saveTokens", (e, t) => {
	if (!o.isEncryptionAvailable()) {
		console.error("safeStorage is not available. Saving unencrypted (not recommended)."), p.writeFileSync(Q(), JSON.stringify(t), "utf-8");
		return;
	}
	let n = JSON.stringify(t), r = o.encryptString(n);
	p.writeFileSync(Q(), r);
}), i.handle("auth:getTokens", () => {
	try {
		let e = p.readFileSync(Q());
		if (o.isEncryptionAvailable()) {
			let t = o.decryptString(e);
			return JSON.parse(t);
		} else return JSON.parse(e.toString("utf-8"));
	} catch {
		return null;
	}
}), i.handle("auth:clearTokens", () => {
	try {
		p.unlinkSync(Q());
	} catch {}
});
var $ = () => g.join(n.getPath("userData"), "api_config.json");
i.handle("api:saveConfig", (e, t) => {
	if (!o.isEncryptionAvailable()) {
		console.warn("safeStorage is not available. Saving API config unencrypted."), p.writeFileSync($(), JSON.stringify(t), "utf-8");
		return;
	}
	let n = JSON.stringify(t), r = o.encryptString(n);
	p.writeFileSync($(), r);
}), i.handle("api:getConfig", () => {
	try {
		let e = p.readFileSync($());
		if (o.isEncryptionAvailable()) {
			let t = o.decryptString(e);
			return JSON.parse(t);
		} else return JSON.parse(e.toString("utf-8"));
	} catch {
		return null;
	}
}), i.handle("extensions:search", async (e, t, n, r, i) => D.search(t, n, r, i)), i.handle("extensions:install", async (e, t, n) => {
	await k.installFromOpenVSX(t, n);
}), i.handle("extensions:uninstall", async (e, t) => {
	await k.uninstall(t);
}), i.handle("extensions:getInstalled", () => O.getInstalled()), i.handle("extensions:toggle", (e, t, n) => {
	O.toggleExtension(t, n);
});
//#endregion
export {};
