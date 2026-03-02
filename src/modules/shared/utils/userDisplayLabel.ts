
export function getUserDisplayLabel(user: Record<string, unknown>): string {
  const mail = user.mail ?? user.email;
  if (mail && typeof mail === 'string') return mail;
  if (user.displayName && typeof user.displayName === 'string') return user.displayName;
  if (user.displayNameAR && typeof user.displayNameAR === 'string') return user.displayNameAR;
  if (user.displayNameEN && typeof user.displayNameEN === 'string') return user.displayNameEN;
  const first = user.first_name ?? user.givenName;
  const last = user.last_name ?? user.sn;
  const full = [first, last].filter(Boolean).join(' ').trim();
  if (full) return full;
  return String(user.username ?? user.cn ?? user.displayName ?? '');
}

export function getUserDisplayId(user: Record<string, unknown>): string {
  const guid = user.objectGUID ?? user.id;
  return guid != null ? String(guid) : '';
}
