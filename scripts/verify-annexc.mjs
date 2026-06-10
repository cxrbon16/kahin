import { readFileSync } from "node:fs";

// --- Load ANNEX_C and THIRD_MATCH_ORDER straight from the source file ---
const src = readFileSync(new URL("../src/lib/annexC.ts", import.meta.url), "utf8");

const orderMatch = src.match(/THIRD_MATCH_ORDER\s*=\s*\[([^\]]*)\]/);
const THIRD_MATCH_ORDER = orderMatch[1].split(",").map((s) => Number(s.trim()));

const ANNEX_C = {};
for (const m of src.matchAll(/([A-L]{8})\s*:\s*"([A-L]{8})"/g)) {
  ANNEX_C[m[1]] = m[2];
}

// Pools per third-place R32 match (from schedule.ts), keyed by match no.
const POOL = {
  74: ["A", "B", "C", "D", "F"],
  77: ["C", "D", "F", "G", "H"],
  79: ["C", "E", "F", "H", "I"],
  80: ["E", "H", "I", "J", "K"],
  81: ["B", "E", "F", "I", "J"],
  82: ["A", "E", "H", "I", "J"],
  85: ["E", "F", "G", "I", "J"],
  87: ["D", "E", "I", "J", "L"],
};

const GROUPS = "ABCDEFGHIJKL".split("");

// --- All C(12,8) = 495 combinations ---
function combinations(arr, k) {
  const res = [];
  const combo = [];
  (function rec(start) {
    if (combo.length === k) { res.push(combo.join("")); return; }
    for (let i = start; i < arr.length; i++) { combo.push(arr[i]); rec(i + 1); combo.pop(); }
  })(0);
  return res;
}
const allCombos = combinations(GROUPS, 8);

let errors = [];
const log = (m) => console.log(m);

// 1. Count
log(`Entries in ANNEX_C: ${Object.keys(ANNEX_C).length}  (expected 495)`);
log(`THIRD_MATCH_ORDER: [${THIRD_MATCH_ORDER.join(", ")}]`);
if (Object.keys(ANNEX_C).length !== 495) errors.push("Entry count is not 495");

// 2. Every combination present, key sorted, no extras
const comboSet = new Set(allCombos);
for (const c of allCombos) if (!(c in ANNEX_C)) errors.push(`MISSING key: ${c}`);
for (const k of Object.keys(ANNEX_C)) {
  if (!comboSet.has(k)) errors.push(`EXTRA/invalid key: ${k}`);
  const sorted = k.split("").sort().join("");
  if (sorted !== k) errors.push(`Key not sorted: ${k}`);
  if (new Set(k).size !== 8) errors.push(`Key has duplicate letters: ${k}`);
}

// 3 + 4. Each value is a permutation of its key AND respects every pool.
let permFail = 0, poolFail = 0;
for (const [key, val] of Object.entries(ANNEX_C)) {
  if (val.length !== 8) { errors.push(`${key}: value length != 8`); continue; }
  // permutation check: same multiset of letters as the key
  if (val.split("").sort().join("") !== key) {
    permFail++;
    if (permFail <= 5) errors.push(`${key}: value ${val} is not a permutation of key`);
    continue;
  }
  // pool check: assignment[i] must be allowed in match THIRD_MATCH_ORDER[i]
  for (let i = 0; i < 8; i++) {
    const matchNo = THIRD_MATCH_ORDER[i];
    const g = val[i];
    if (!POOL[matchNo].includes(g)) {
      poolFail++;
      if (poolFail <= 8)
        errors.push(`${key}: match ${matchNo} got group ${g}, not in pool [${POOL[matchNo].join(",")}]`);
    }
  }
}
log(`Permutation failures: ${permFail}`);
log(`Pool-constraint failures: ${poolFail}`);

// 5. Spot-check against known official Wikipedia values (Annex C reference rows).
// Format: key -> { matchNo: expectedGroup }
const SPOT = {
  // Row used to originally verify generation: EFGHIJKL
  EFGHIJKL: { 79: "E", 85: "J", 81: "I", 74: "F", 82: "H", 77: "G", 87: "L", 80: "K" },
  // First table row: ABCDEFGH
  ABCDEFGH: { 74: "C", 77: "F", 79: "H", 80: "E", 81: "B", 82: "A", 85: "G", 87: "D" },
};
for (const [key, exp] of Object.entries(SPOT)) {
  const val = ANNEX_C[key];
  if (!val) { errors.push(`SPOT key ${key} missing`); continue; }
  for (const [matchNo, g] of Object.entries(exp)) {
    const i = THIRD_MATCH_ORDER.indexOf(Number(matchNo));
    if (val[i] !== g)
      errors.push(`SPOT ${key}: match ${matchNo} expected ${g} but table has ${val[i]} (full: ${val})`);
  }
}
log(`Spot-checked official rows: ${Object.keys(SPOT).join(", ")}`);

// --- Result ---
console.log("\n" + "=".repeat(50));
if (errors.length === 0) {
  console.log("RESULT: ALL 495 SCENARIOS VALID. No errors.");
} else {
  console.log(`RESULT: ${errors.length} ERROR(S):`);
  errors.slice(0, 40).forEach((e) => console.log("  - " + e));
  if (errors.length > 40) console.log(`  ... and ${errors.length - 40} more`);
  process.exitCode = 1;
}
