import * as fs from 'fs';
import * as path from 'path';
import { app, net } from 'electron';
import extract from 'extract-zip';
import { extensionRegistry } from './ExtensionRegistry';
import { OpenVSXClient } from './OpenVSXClient';

export class VSIXInstaller {
  private static extensionsDir = path.join(app.getPath('userData'), 'extensions');

  private static ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  static async installFromOpenVSX(namespace: string, name: string): Promise<void> {
    try {
      // 1. Fetch metadata
      const extInfo = await OpenVSXClient.getExtension(namespace, name);
      const downloadUrl = extInfo.files.download;
      const extensionId = `${namespace}.${name}`;

      this.ensureDir(this.extensionsDir);
      const installPath = path.join(this.extensionsDir, extensionId);
      const tempZipPath = path.join(this.extensionsDir, `${extensionId}.temp.vsix`);

      // 2. Download VSIX
      await new Promise<void>((resolve, reject) => {
        const request = net.request(downloadUrl);
        const fileStream = fs.createWriteStream(tempZipPath);
        
        request.on('response', (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download extension: HTTP ${response.statusCode}`));
            return;
          }
          
          response.on('data', (chunk) => {
            fileStream.write(chunk);
          });
          
          response.on('end', () => {
            fileStream.end();
            resolve();
          });
        });
        
        request.on('error', (error) => {
          fileStream.close();
          fs.unlinkSync(tempZipPath);
          reject(error);
        });
        
        request.end();
      });

      // 3. Clean existing directory if upgrading/reinstalling
      if (fs.existsSync(installPath)) {
        fs.rmSync(installPath, { recursive: true, force: true });
      }

      // 4. Extract
      await extract(tempZipPath, { dir: installPath });

      // 5. Cleanup temp file
      fs.unlinkSync(tempZipPath);

      // 6. Register
      extensionRegistry.addExtension({
        id: extensionId,
        namespace,
        name,
        version: extInfo.version,
        displayName: extInfo.displayName || name,
        description: extInfo.description || '',
        publisher: extInfo.publisher || namespace,
        installPath,
        iconUrl: extInfo.files.icon || extInfo.iconUrl
      });

    } catch (error) {
      console.error(`Failed to install ${namespace}.${name}:`, error);
      throw error;
    }
  }

  static async uninstall(id: string): Promise<void> {
    const ext = extensionRegistry.getExtension(id);
    if (!ext) return;

    if (fs.existsSync(ext.installPath)) {
      fs.rmSync(ext.installPath, { recursive: true, force: true });
    }
    
    extensionRegistry.removeExtension(id);
  }
}
