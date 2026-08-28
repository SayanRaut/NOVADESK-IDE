import { net } from 'electron';

export interface OpenVSXExtension {
  namespace: string;
  name: string;
  version: string;
  displayName: string;
  description: string;
  publisher: string;
  downloadCount: number;
  averageRating: number;
  reviewCount: number;
  iconUrl?: string;
  files: {
    download: string;
    icon?: string;
    readme?: string;
    changelog?: string;
  };
}

export interface OpenVSXSearchResponse {
  offset: number;
  totalSize: number;
  extensions: OpenVSXExtension[];
}

export class OpenVSXClient {
  private static BASE_URL = 'https://open-vsx.org/api';

  static async search(query: string = '', sortBy: string = 'downloadCount', sortOrder: string = 'desc', offset: number = 0, size: number = 20): Promise<OpenVSXSearchResponse> {
    const url = `${this.BASE_URL}/-/search?query=${encodeURIComponent(query)}&sortBy=${sortBy}&sortOrder=${sortOrder}&offset=${offset}&size=${size}`;
    
    return new Promise((resolve, reject) => {
      const request = net.request(url);
      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Open VSX API returned status ${response.statusCode}`));
          return;
        }
        
        let body = '';
        response.on('data', (chunk) => {
          body += chunk.toString();
        });
        
        response.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data as OpenVSXSearchResponse);
          } catch {
            reject(new Error('Failed to parse Open VSX response'));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.end();
    });
  }

  static async getExtension(namespace: string, name: string): Promise<OpenVSXExtension> {
    const url = `${this.BASE_URL}/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;
    
    return new Promise((resolve, reject) => {
      const request = net.request(url);
      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Open VSX API returned status ${response.statusCode}`));
          return;
        }
        
        let body = '';
        response.on('data', (chunk) => {
          body += chunk.toString();
        });
        
        response.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data as OpenVSXExtension);
          } catch {
            reject(new Error('Failed to parse Open VSX response'));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.end();
    });
  }
}
