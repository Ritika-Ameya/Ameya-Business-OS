export const getExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
};

export const getBasename = (filename: string): string => {
  const lastSlash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
  return lastSlash === -1 ? filename : filename.slice(lastSlash + 1);
};

export const getNameWithoutExtension = (filename: string): string => {
  const basename = getBasename(filename);
  const lastDot = basename.lastIndexOf('.');
  return lastDot === -1 ? basename : basename.slice(0, lastDot);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, index);
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const isAllowedExtension = (filename: string, allowed: string[]): boolean => {
  const ext = getExtension(filename);
  return allowed.map((e) => e.toLowerCase()).includes(ext);
};

export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};
