const { createPublicKey, createPrivateKey, randomBytes } = require("crypto");
const { CompactEncrypt, compactDecrypt, SignJWT, jwtVerify } = require("jose");

const {
  JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY,
  JWT_ACCESS_TOKEN_EXPIRE,
  JWT_REFRESH_TOKEN_EXPIRE,
} = require("../config/config");

// ===============================
// Helper — Fail fast if env missing
// ===============================
function getEnvOrThrow(name, value) {
  if (!value) {
    throw new Error(`${name} is not set in environment`);
  }
  return value;
}

// ===============================
// Load keys from ENV
// ===============================
const privateKey = createPrivateKey(
  getEnvOrThrow("JWT_PRIVATE_KEY", JWT_PRIVATE_KEY).replace(/\\n/g, "\n"),
);

const publicKey = createPublicKey(
  getEnvOrThrow("JWT_PUBLIC_KEY", JWT_PUBLIC_KEY).replace(/\\n/g, "\n"),
);

// ===============================
// Expiry helpers
// ===============================
const getAccessTokenExpiry = () => parseInt(JWT_ACCESS_TOKEN_EXPIRE || "900");

const getRefreshTokenExpiry = () =>
  parseInt(JWT_REFRESH_TOKEN_EXPIRE || "604800");

// ===============================
// Generate ACCESS token (JWT + JWE)
// ===============================
const generateAccessToken = async ({
  userId,
  clientId,
  email,
  name,
  isActive,
}) => {
  const jwt = await new SignJWT({
    id: userId,
    clientId,
    email,
    name,
    isActive,
    type: "access",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime(`${getAccessTokenExpiry()}s`)
    .sign(privateKey);

  return new CompactEncrypt(new TextEncoder().encode(jwt))
    .setProtectedHeader({ alg: "RSA-OAEP-256", enc: "A256GCM" })
    .encrypt(publicKey);
};

// ===============================
// Generate RANDOM refresh token string
// ===============================
const generateRefreshTokenString = () => randomBytes(40).toString("hex");

// ===============================
// Decrypt & verify access token
// ===============================
const decryptAndVerifyJWT = async (token) => {
  const { plaintext } = await compactDecrypt(token, privateKey);
  const jwt = new TextDecoder().decode(plaintext);
  const { payload } = await jwtVerify(jwt, publicKey);
  return payload;
};

module.exports = {
  generateAccessToken,
  generateRefreshTokenString,
  decryptAndVerifyJWT,
  getAccessTokenExpiry,
  getRefreshTokenExpiry,
};
