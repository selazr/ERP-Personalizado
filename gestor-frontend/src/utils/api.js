const RAW_API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

const normalizeBase = base => base.replace(/\/+$/, '');
const normalizePath = path => `/${path.replace(/^\/+/, '')}`;

const normalizedBase = normalizeBase(RAW_API_BASE_URL);

const buildOriginRelativeUrl = (base, path) => {
  if (!base) {
    return path;
  }

  if (base.startsWith('/')) {
    return `${base}${path}`;
  }

  return `/${base.replace(/^\/+/, '')}${path}`;
};

export const API_BASE_URL = normalizedBase;

export const apiUrl = (path = '') => {
  const finalPath = normalizePath(path);

  if (!normalizedBase) {
    return finalPath;
  }

  const lowerBase = normalizedBase.toLowerCase();
  if (lowerBase.startsWith('http://') || lowerBase.startsWith('https://')) {
    return `${normalizedBase}${finalPath}`;
  }

  try {
    const url = new URL(normalizedBase);
    return `${url.toString().replace(/\/$/, '')}${finalPath}`;
  } catch (error) {
    return buildOriginRelativeUrl(normalizedBase, finalPath);
  }
};
