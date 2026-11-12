// FRONTEND UI ONLY: portal identity is separate from backend operation permissions.
export function portalPath(role, path) {
  const match = path.match(/^\/(staff|admin)(?=\/|[?#]|$)/);
  if (!match) return path;
  if (role === 'ADMIN' && match[1] === 'staff') {
    const suffix = path.slice('/staff'.length);
    if (!suffix || suffix.startsWith('?') || suffix.startsWith('#')) return `/admin${suffix}`;
    if (/^\/(items|claims|handovers|tickets)([?#].*)?$/.test(suffix) || /^\/claims\/[^/?#]+([?#].*)?$/.test(suffix)) return `/admin${suffix}`;
    return '/admin';
  }
  if (role === 'STAFF' && match[1] === 'admin') return '/staff';
  if (role !== 'ADMIN' && role !== 'STAFF') return '/403';
  return path;
}
