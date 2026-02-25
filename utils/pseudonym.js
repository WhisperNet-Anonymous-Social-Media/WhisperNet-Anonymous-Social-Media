const crypto = require("crypto");

const ADJECTIVES = [
  "Neon",
  "Silent",
  "Velvet",
  "Crimson",
  "Cosmic",
  "Shadow",
  "Lunar",
  "Silver",
  "Electric",
  "Frozen",
  "Golden",
  "Mystic",
];

const NOUNS = [
  "Ghost",
  "Falcon",
  "Wolf",
  "Cipher",
  "Phantom",
  "Comet",
  "Echo",
  "Raven",
  "Drifter",
  "Nova",
  "Sparrow",
  "Mirage",
];

function hashToIndex(input, modulo) {
  const digest = crypto.createHash("sha256").update(input).digest("hex");
  return parseInt(digest.slice(0, 8), 16) % modulo;
}

function generatePseudonym(seed, attempt = 0) {
  const salt = process.env.PSEUDONYM_SALT || "whispernet-default-salt";
  const base = `${seed}:${salt}:${attempt}`;

  const adjective = ADJECTIVES[hashToIndex(`${base}:adj`, ADJECTIVES.length)];
  const noun = NOUNS[hashToIndex(`${base}:noun`, NOUNS.length)];

  // "Neon Ghost" style label
  return `${adjective} ${noun}`;
}

module.exports = generatePseudonym;
