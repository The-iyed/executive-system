
export function getUserDisplayLabel(user: Record<string, unknown>): string {
  if (user.displayNameAR && typeof user.displayNameAR === 'string') return user.displayNameAR;
  if (user.displayName && typeof user.displayName === 'string') return user.displayName;
  if (user.displayNameEN && typeof user.displayNameEN === 'string') return user.displayNameEN;
  if (user.givenName && typeof user.givenName === 'string') return user.givenName;
  if (user.name && typeof user.name === 'string') return user.name;
  if (user.username && typeof user.username === 'string') return user.username;
  const first = user.first_name ?? user.givenName;
  const last = user.last_name ?? user.sn;
  const full = [first, last].filter(Boolean).join(' ').trim();
  if (full) return full;
  const mail = user.mail ?? user.email;
  if (mail && typeof mail === 'string') return mail;
  return String(user.cn ?? '');
}

export function getUserDisplayId(user: Record<string, unknown>): string {
  const guid = user.objectGUID ?? user.id;
  return guid != null ? String(guid) : '';
}
