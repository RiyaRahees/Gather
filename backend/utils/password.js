import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(plainText) {
  if (!plainText || typeof plainText !== "string") {
    throw new Error("Password must be a valid non-empty string");
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText, hashedPassword) {
  if (!plainText || !hashedPassword) return false;
  return bcrypt.compare(plainText, hashedPassword);
}

export default { hashPassword, comparePassword };
