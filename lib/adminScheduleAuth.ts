import crypto from 'node:crypto';

const COOKIE_NAME = 'admin_schedule_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  login: string;
  exp: number;
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function getAuthSecret(): string {
  const secret = process.env.ADMIN_SCHEDULE_AUTH_SECRET?.trim() || process.env.SCHEDULE_SYNC_SECRET?.trim();
  if (!secret) {
    throw new Error('ADMIN_SCHEDULE_AUTH_SECRET (or SCHEDULE_SYNC_SECRET) is required');
  }
  return secret;
}

export function getAdminScheduleCredentials():
  | { login: string; password: string }
  | null {
  const login = process.env.ADMIN_SCHEDULE_LOGIN?.trim();
  const password = process.env.ADMIN_SCHEDULE_PASSWORD?.trim();
  if (!login || !password) return null;
  return { login, password };
}

export function buildSessionToken(login: string): string {
  const payload: SessionPayload = {
    login,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', getAuthSecret()).update(encoded).digest('hex');
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = crypto.createHmac('sha256', getAuthSecret()).update(encoded).digest('hex');
  if (!timingSafeEqualHex(signature, expected)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encoded)) as SessionPayload;
  } catch {
    return null;
  }

  if (!payload?.login || !payload?.exp) return null;
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function getCookieName(): string {
  return COOKIE_NAME;
}
