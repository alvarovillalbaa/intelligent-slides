import { createHmac, timingSafeEqual } from "node:crypto"

import { getSigningSecret } from "@/lib/env"

export type AccessTokenScope = "embed" | "artifact"

export interface SignedAccessClaims {
  publicId: string
  versionId?: string
  scope: AccessTokenScope
  exp: number
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url")
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signPayload(payload: string) {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url")
}

export function createSignedAccessToken(claims: SignedAccessClaims) {
  const payload = toBase64Url(JSON.stringify(claims))
  const signature = signPayload(payload)
  return `${payload}.${signature}`
}

export function verifySignedAccessToken(token: string, scope: AccessTokenScope) {
  const [payload, signature] = token.split(".")
  if (!payload || !signature) {
    return null
  }

  const expected = signPayload(payload)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null
  }

  try {
    const claims = JSON.parse(fromBase64Url(payload)) as SignedAccessClaims
    if (claims.scope !== scope || claims.exp < Date.now()) {
      return null
    }
    return claims
  } catch {
    return null
  }
}

export function createSignedAccessUrl(input: {
  scope: AccessTokenScope
  path: string
  publicId: string
  versionId?: string
  expiresInMs?: number
}) {
  const token = createSignedAccessToken({
    publicId: input.publicId,
    versionId: input.versionId,
    scope: input.scope,
    exp: Date.now() + (input.expiresInMs ?? 1000 * 60 * 60 * 24 * 7),
  })

  const separator = input.path.includes("?") ? "&" : "?"
  return `${input.path}${separator}token=${encodeURIComponent(token)}`
}
