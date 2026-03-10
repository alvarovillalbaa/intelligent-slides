import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const HASH_DELIMITER = ":"

export function hashSecret(secret: string) {
  const salt = randomBytes(16).toString("hex")
  const key = scryptSync(secret, salt, 64).toString("hex")
  return `${salt}${HASH_DELIMITER}${key}`
}

export function verifySecret(secret: string, digest: string) {
  const [salt, storedKey] = digest.split(HASH_DELIMITER)
  if (!salt || !storedKey) {
    return false
  }

  const derivedKey = scryptSync(secret, salt, 64)
  const storedBuffer = Buffer.from(storedKey, "hex")

  if (storedBuffer.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(storedBuffer, derivedKey)
}

export function createSessionToken() {
  return randomBytes(24).toString("hex")
}

export function createLookupHash(secret: string) {
  return createHash("sha256").update(secret).digest("hex")
}
