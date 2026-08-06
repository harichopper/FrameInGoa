export function parseCookies(req: any): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie: string) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });

  return list;
}

export function serializeCookie(name: string, val: string, options: any = {}): string {
  const pairs = [name + '=' + encodeURIComponent(val)];

  if (options.maxAge != null) {
    const maxAge = Number(options.maxAge);
    if (isNaN(maxAge) || !isFinite(maxAge)) {
      throw new Error('maxAge option must be a number');
    }
    pairs.push('Max-Age=' + maxAge);
  }

  if (options.domain) pairs.push('Domain=' + options.domain);
  if (options.path) pairs.push('Path=' + options.path);
  if (options.expires) pairs.push('Expires=' + options.expires.toUTCString());
  if (options.httpOnly) pairs.push('HttpOnly');
  if (options.secure) pairs.push('Secure');
  if (options.sameSite) {
    const sameSite = typeof options.sameSite === 'string'
      ? options.sameSite.toLowerCase()
      : options.sameSite;

    switch (sameSite) {
      case 'lax':
        pairs.push('SameSite=Lax');
        break;
      case 'strict':
        pairs.push('SameSite=Strict');
        break;
      case 'none':
        pairs.push('SameSite=None');
        break;
      default:
        break;
    }
  }

  return pairs.join('; ');
}
