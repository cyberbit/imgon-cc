export type DownloadSpec = {
  data: Blob,
  size: number,
  type: string,
  filename: string
}

export function getDownloadDataURL(data: BlobPart, type: string, filename: string) {
    const blob = new Blob([data], { type: type });
    const fileURL = window.URL.createObjectURL(blob);
    
    return fileURL;
}

export async function downloadData(data: BlobPart, type: string, filename: string) {
  try {
    const blob = new Blob([data], { type: type });

    const fileURL = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = fileURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(fileURL); // Clean up
  } catch (error) {
    console.error("Download failed:", error);
  }
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 bytes'
    
    const factor = 1024
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB']

    const scale = Math.floor(Math.log(bytes) / Math.log(factor))

    return parseFloat((bytes / Math.pow(factor, scale)).toFixed(2)) + ' ' + sizes[scale]
}