/**
 * Bulk migration script: indigo/violet → orange/amber (Mistral.ai theme)
 * Replaces all remaining indigo and violet Tailwind color references
 * across the entire src/ directory.
 */

const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");

// Mapping of indigo → orange/amber replacements
const REPLACEMENTS = [
    // indigo shade mappings (most specific patterns first)
    [/\bindigo-950\b/g, "orange-950"],
    [/\bindigo-900\b/g, "orange-900"],
    [/\bindigo-800\b/g, "orange-800"],
    [/\bindigo-700\b/g, "orange-600"],
    [/\bindigo-600\b/g, "orange-500"],
    [/\bindigo-500\b/g, "orange-500"],
    [/\bindigo-400\b/g, "orange-400"],
    [/\bindigo-300\b/g, "orange-300"],
    [/\bindigo-200\b/g, "orange-200"],
    [/\bindigo-100\b/g, "orange-100"],
    [/\bindigo-50\b/g, "orange-50"],

    // purple shade mappings → amber
    [/\bpurple-950\b/g, "amber-950"],
    [/\bpurple-900\b/g, "amber-900"],
    [/\bpurple-800\b/g, "amber-800"],
    [/\bpurple-700\b/g, "amber-700"],
    [/\bpurple-600\b/g, "amber-600"],
    [/\bpurple-500\b/g, "amber-500"],
    [/\bpurple-400\b/g, "amber-400"],
    [/\bpurple-300\b/g, "amber-300"],
    [/\bpurple-200\b/g, "amber-200"],
    [/\bpurple-100\b/g, "amber-100"],
    [/\bpurple-50\b/g, "amber-50"],

    // violet shade mappings → amber
    [/\bviolet-950\b/g, "amber-950"],
    [/\bviolet-900\b/g, "amber-900"],
    [/\bviolet-800\b/g, "amber-800"],
    [/\bviolet-700\b/g, "amber-700"],
    [/\bviolet-600\b/g, "amber-600"],
    [/\bviolet-500\b/g, "amber-500"],
    [/\bviolet-400\b/g, "amber-400"],
    [/\bviolet-300\b/g, "amber-300"],
    [/\bviolet-200\b/g, "amber-200"],
    [/\bviolet-100\b/g, "amber-100"],
    [/\bviolet-50\b/g, "amber-50"],
];

// Files/directories to skip
const SKIP_PATTERNS = [
    "node_modules",
    ".next",
    "scripts/migrate-to-mistral-theme.js", // don't self-modify
];

function shouldSkip(filePath) {
    return SKIP_PATTERNS.some((p) => filePath.includes(p));
}

function walk(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (shouldSkip(fullPath)) continue;
        if (entry.isDirectory()) {
            results.push(...walk(fullPath));
        } else if (/\.(tsx?|jsx?|css)$/.test(entry.name)) {
            results.push(fullPath);
        }
    }
    return results;
}

let totalFiles = 0;
let totalReplacements = 0;

const files = walk(SRC_DIR);

for (const file of files) {
    let content = fs.readFileSync(file, "utf-8");
    let original = content;
    let fileReplacements = 0;

    for (const [pattern, replacement] of REPLACEMENTS) {
        const matches = content.match(pattern);
        if (matches) {
            fileReplacements += matches.length;
            content = content.replace(pattern, replacement);
        }
    }

    if (content !== original) {
        fs.writeFileSync(file, content, "utf-8");
        totalFiles++;
        totalReplacements += fileReplacements;
        const relPath = path.relative(path.join(__dirname, ".."), file);
        console.log(`  ✓ ${relPath} (${fileReplacements} replacements)`);
    }
}

console.log(`\n━━━ Migration Complete ━━━`);
console.log(`Files modified: ${totalFiles}`);
console.log(`Total replacements: ${totalReplacements}`);
