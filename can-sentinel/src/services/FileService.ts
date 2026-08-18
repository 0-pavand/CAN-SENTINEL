export interface FileDefinition {
  name: string;
  size: number;
  type: 'log' | 'dbc';
  path?: string; // Abstracted path
  raw?: File; // Only in browser
}

export interface FileService {
  pickFile(type: 'log' | 'dbc'): Promise<FileDefinition | null>;
}

// MOCK IMPLEMENTATION — replace with Capacitor filesystem APIs during mobile integration
export class WebFileService implements FileService {
  async pickFile(type: 'log' | 'dbc'): Promise<FileDefinition | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      // Android WebView file picker often disables arbitrary extensions like .log or .dbc
      // Setting accept to '*/*' ensures all files are selectable on mobile devices.
      input.accept = '*/*';

      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const file = target.files[0];
          resolve({
            name: file.name,
            size: file.size,
            type,
            raw: file
          });
        } else {
          resolve(null);
        }
      };

      input.click();
    });
  }
}

// Singleton instance
export const fileService: FileService = new WebFileService();
