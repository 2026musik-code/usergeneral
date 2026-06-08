export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers or non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateVlessLink(params: {
  uuid: string;
  address: string;
  port: string;
  sni: string;
  encryption: string;
  type: string;
  host: string;
  path: string;
  security: string;
  remarks: string;
}) {
  const { uuid, address, port, sni, encryption, type, host, path, security, remarks } = params;
  
  const searchParams = new URLSearchParams();
  searchParams.set('encryption', encryption || 'none');
  if (security && security !== 'none') {
    searchParams.set('security', security);
  }
  if (sni) searchParams.set('sni', sni);
  searchParams.set('fp', 'random');
  searchParams.set('type', type || 'ws');
  if (host) searchParams.set('host', host);
  if (path) searchParams.set('path', path);
  
  const encodedRemarks = encodeURIComponent(remarks || 'USER-GENERAL-VLESS');
  
  return `vless://${uuid}@${address}:${port}?${searchParams.toString()}#${encodedRemarks}`;
}
