import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface InstalledExtension {
  id: string; // namespace.name
  namespace: string;
  name: string;
  version: string;
  displayName: string;
  description: string;
  publisher: string;
  enabled: boolean;
  installPath: string;
  iconUrl?: string;
  installedAt: number;
}

export class ExtensionRegistry {
  private registryPath: string;
  private installedExtensions: Map<string, InstalledExtension>;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.registryPath = path.join(userDataPath, 'extensions.json');
    this.installedExtensions = new Map();
    this.load();
  }

  private load() {
    if (fs.existsSync(this.registryPath)) {
      try {
        const data = fs.readFileSync(this.registryPath, 'utf8');
        const parsed = JSON.parse(data) as InstalledExtension[];
        parsed.forEach(ext => this.installedExtensions.set(ext.id, ext));
      } catch (e) {
        console.error('Failed to load extension registry', e);
      }
    }
  }

  private save() {
    try {
      const data = Array.from(this.installedExtensions.values());
      fs.writeFileSync(this.registryPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save extension registry', e);
    }
  }

  public getInstalled(): InstalledExtension[] {
    return Array.from(this.installedExtensions.values());
  }

  public getExtension(id: string): InstalledExtension | undefined {
    return this.installedExtensions.get(id);
  }

  public addExtension(ext: Omit<InstalledExtension, 'enabled' | 'installedAt'>) {
    this.installedExtensions.set(ext.id, {
      ...ext,
      enabled: true,
      installedAt: Date.now()
    });
    this.save();
  }

  public removeExtension(id: string) {
    if (this.installedExtensions.has(id)) {
      this.installedExtensions.delete(id);
      this.save();
    }
  }

  public toggleExtension(id: string, enabled: boolean) {
    const ext = this.installedExtensions.get(id);
    if (ext) {
      ext.enabled = enabled;
      this.save();
    }
  }
}

// Global singleton instance
export const extensionRegistry = new ExtensionRegistry();
