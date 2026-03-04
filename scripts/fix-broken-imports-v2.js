/**
 * Fix broken useLocale imports - the pattern is:
 * import {
 * import { useLocale } from "@/hooks/use-locale";
 *   SomeComponent,
 * 
 * We need to remove the broken line and add the import correctly.
 */
const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, '..', 'src', 'app', '(dashboard)');

function findPages(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findPages(fullPath));
    } else if (entry.name === 'page.tsx') {
      results.push(fullPath);
    }
  }
  return results;
}

const pages = findPages(dashboardDir);
let fixed = 0;

for (const pagePath of pages) {
  let content = fs.readFileSync(pagePath, 'utf-8');
  const relPath = path.relative(dashboardDir, pagePath);

  // Check for the broken pattern: a line that is exactly 'import { useLocale } from "@/hooks/use-locale";'
  // preceded by a line ending with 'import {'
  const brokenLine = 'import { useLocale } from "@/hooks/use-locale";';
  
  if (!content.includes(brokenLine)) continue;

  const lines = content.split('\n');
  const idx = lines.findIndex(l => l.trim() === brokenLine);
  if (idx === -1) continue;

  // Check if the previous line is part of an incomplete import (ends with '{' or is 'import {')
  const prevLine = idx > 0 ? lines[idx - 1].trim() : '';
  const isInsideImport = prevLine.endsWith('{') || prevLine.endsWith(',') || 
                         (prevLine.startsWith('import') && !prevLine.includes('from'));

  if (!isInsideImport) {
    // Import is correctly placed, skip
    continue;
  }

  console.log(`Fixing: ${relPath} (broken import at line ${idx + 1})`);

  // Remove the broken import line
  lines.splice(idx, 1);

  // Also remove `const { t } = useLocale();` if present
  const constIdx = lines.findIndex(l => l.trim() === 'const { t } = useLocale();');
  if (constIdx !== -1) {
    lines.splice(constIdx, 1);
  }

  content = lines.join('\n');

  // Now find the correct place to add it - after the LAST import...from line
  const finalLines = content.split('\n');
  let lastImportLine = -1;
  
  for (let i = 0; i < finalLines.length; i++) {
    const trimmed = finalLines[i].trim();
    // Match lines that end an import statement (contain 'from' and end with ';')
    if (trimmed.match(/from\s+["'].*["'];?\s*$/)) {
      lastImportLine = i;
    }
  }

  if (lastImportLine === -1) {
    console.log(`  ERROR: could not find last import line`);
    continue;
  }

  // Insert after last import
  finalLines.splice(lastImportLine + 1, 0, 'import { useLocale } from "@/hooks/use-locale";');
  content = finalLines.join('\n');

  // Re-add const { t } = useLocale(); if needed
  if (!content.includes('const { t } = useLocale()')) {
    const funcMatch = content.match(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/);
    if (funcMatch) {
      const funcEnd = content.indexOf(funcMatch[0]) + funcMatch[0].length;
      content = content.substring(0, funcEnd) + '\n  const { t } = useLocale();' + content.substring(funcEnd);
    }
  }

  fs.writeFileSync(pagePath, content, 'utf-8');
  fixed++;
}

console.log(`\nFixed ${fixed} files`);
