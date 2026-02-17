const fs = require("fs");
const path = require("path");
const { generateKeyPairSync } = require("crypto");

const keysDir = path.join(__dirname, "..", "keys");

const paths = {
  privateKey: path.join(keysDir, "private.key"),
  publicKey: path.join(keysDir, "public.key"),
  privateEnv: path.join(keysDir, "private_env.txt"),
  publicEnv: path.join(keysDir, "public_env.txt"),
};

/**
 * Ensure keys directory exists
 */
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
  console.log("📁 Created keys/ directory");
}

/**
 * Prevent accidental overwrite
 */
if (fs.existsSync(paths.privateKey) || fs.existsSync(paths.publicKey)) {
  console.error("❌ Keys already exist.");
  console.error("👉 Delete keys/ directory if you really want to regenerate.");
  process.exit(1);
}

/**
 * Generate RSA key pair
 */
console.log("🔐 Generating RSA key pair...");

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

/**
 * Write raw key files
 */
fs.writeFileSync(paths.privateKey, privateKey, { mode: 0o600 });
fs.writeFileSync(paths.publicKey, publicKey, { mode: 0o644 });

console.log("✅ Raw key files created");

/**
 * Convert keys to ENV-safe format
 */
function convertToEnv(inputPath, outputPath, label) {
  const key = fs.readFileSync(inputPath, "utf8");
  const escaped = key.replace(/\r?\n/g, "\\n").trim();
  fs.writeFileSync(outputPath, escaped);
  console.log(`✅ ${label} ENV key created → ${path.basename(outputPath)}`);
}

convertToEnv(paths.privateKey, paths.privateEnv, "PRIVATE");
convertToEnv(paths.publicKey, paths.publicEnv, "PUBLIC");

/**
 * Final message
 */
console.log("\n🚀 Keys generated and converted successfully.");
console.log("⚠️  NEVER commit files inside the keys/ directory.");
