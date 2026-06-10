import { readFileSync } from "node:fs";

// --- Our table ---
const src = readFileSync(new URL("../src/lib/annexC.ts", import.meta.url), "utf8");
const ANNEX_C = {};
for (const m of src.matchAll(/([A-L]{8})\s*:\s*"([A-L]{8})"/g)) ANNEX_C[m[1]] = m[2];

// --- Wikipedia raw wikitext ---
const wiki = readFileSync("/tmp/wiki_raw.txt", "utf8");

// Wikipedia assignment column order: 1A,1B,1D,1E,1G,1I,1K,1L
// Our THIRD_MATCH_ORDER [74,77,79,80,81,82,85,87] winners: 1E,1I,1A,1L,1D,1G,1B,1K
// -> index of each our-match's winner within the wiki column order:
const WIKI_INDEX = [3, 5, 0, 7, 2, 4, 1, 6];

// Split into per-row blocks at each "! scope=\"row\" | N"
const blocks = wiki.split(/!\s*scope="row"\s*\|/).slice(1);
console.log(`Parsed row blocks: ${blocks.length}`);

let checked = 0;
let mismatches = [];
let parseFails = [];
const seenKeys = new Set();

for (const block of blocks) {
  // Row number = leading integer
  const numMatch = block.match(/^\s*(\d+)/);
  const rowNo = numMatch ? numMatch[1] : "?";
  // Cut the block at the next table row boundary if present
  const body = block.split(/\n!\s*scope/)[0];

  // Bold group letters = the 8 qualifying groups (the key)
  const bold = [...body.matchAll(/'''([A-L])'''/g)].map((m) => m[1]);
  // Assignment cells like 3E, 3J ... in wiki column order
  const assigns = [...body.matchAll(/3([A-L])\b/g)].map((m) => m[1]);

  if (bold.length !== 8 || assigns.length !== 8) {
    parseFails.push(`row ${rowNo}: bold=${bold.length} assigns=${assigns.length}`);
    continue;
  }

  const key = [...bold].sort().join("");
  seenKeys.add(key);

  // Build expected value in OUR match order from wiki assignment columns
  const expected = WIKI_INDEX.map((wi) => assigns[wi]).join("");

  const ours = ANNEX_C[key];
  checked++;
  if (!ours) {
    mismatches.push(`row ${rowNo} key ${key}: MISSING in our table`);
  } else if (ours !== expected) {
    mismatches.push(`row ${rowNo} key ${key}: ours=${ours} wiki=${expected}`);
  }
}

// Coverage: every key in our table seen in wiki?
const ourKeys = Object.keys(ANNEX_C);
const notInWiki = ourKeys.filter((k) => !seenKeys.has(k));

console.log(`Distinct keys from wiki: ${seenKeys.size}`);
console.log(`Rows compared: ${checked}`);
console.log(`Parse failures: ${parseFails.length}`);
parseFails.slice(0, 10).forEach((p) => console.log("  ! " + p));
console.log(`Our-table keys absent from wiki: ${notInWiki.length}`);
notInWiki.slice(0, 10).forEach((k) => console.log("  ! " + k));

console.log("\n" + "=".repeat(56));
if (mismatches.length === 0 && parseFails.length === 0 && notInWiki.length === 0 && seenKeys.size === 495) {
  console.log("RESULT: ALL 495 ROWS MATCH WIKIPEDIA EXACTLY. 0 mismatches.");
} else {
  console.log(`RESULT: ${mismatches.length} MISMATCH(ES):`);
  mismatches.slice(0, 50).forEach((m) => console.log("  - " + m));
  if (mismatches.length > 50) console.log(`  ... and ${mismatches.length - 50} more`);
  process.exitCode = 1;
}
