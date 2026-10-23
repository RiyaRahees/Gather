import jwt from "jsonwebtoken";

const FALLBACK_SECRET = "eventflow_fallback_secret_key_2026";

function getSecret() {
  return process.env.JWT_SECRET || FALLBACK_SECRET;
}

const JWT_EXPIRES_IN = "7d";

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function signAdminToken(payload) {
  return jwt.sign(
    { ...payload, role: "admin", tokenType: "admintoken" },
    getSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function signUserToken(payload) {
  return jwt.sign(
    { ...payload, role: "user", tokenType: "usertoken" },
    getSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, getSecret());
  } catch {
    // Try fallback secret in case server loaded with default secret
    try {
      return jwt.verify(token, FALLBACK_SECRET);
    } catch {
      return null;
    }
  }
}

export default { signToken, signAdminToken, signUserToken, verifyToken };
