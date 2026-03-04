/**
 * Fix ALL broken useLocale imports across the codebase.
 * The original script inserted `import { useLocale }` inside multi-line import blocks.
 * This script:
 *   1. Removes the broken import line and any added `const { t } = useLocale();`
 *   2. Re-adds both correctly
 *   3. Also fixes the academic-calendar form value issue
 */
const fs = require('fs');
const path = require('path');
const dashboardDir = path.join(__dirname, '..', 'src', 'app', '(dashboard)');

// Recursively find all page.tsx files
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

  // Check if this file has a broken import (useLocale inside another import block)
  const brokenPattern = /import \{\n\s*import \{ useLocale \} from "@\/hooks\/use-locale";/;
  if (!brokenPattern.test(content)) {
    continue;
  }

  console.log(`Fixing: ${relPath}`);

  // Step 1: Remove the broken import line
  const lines = content.split('\n');
  const brokenIdx = lines.findIndex(l => l.trim() === 'import { useLocale } from "@/hooks/use-locale";');
  if (brokenIdx !== -1) {
    lines.splice(brokenIdx, 1);
  }

  // Step 2: Remove the injected `const { t } = useLocale();` line
  const constIdx = lines.findIndex(l => l.trim() === 'const { t } = useLocale();');
  if (constIdx !== -1) {
    lines.splice(constIdx, 1);
  }

  content = lines.join('\n');

  // Step 3: Find the correct last import position
  // Parse through to find where all import statements end
  const newLines = content.split('\n');
  let lastImportEnd = -1;
  let depth = 0; // track nested braces in imports
  let inImport = false;

  for (let i = 0; i < newLines.length; i++) {
    const line = newLines[i].trim();

    if (line.startsWith('import ') || line.startsWith('import{')) {
      inImport = true;
      // Count opening braces
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
    }

    if (inImport) {
      if (!line.startsWith('import')) {
        depth += (line.match(/\{/g) || []).length;
        depth -= (line.match(/\}/g) || []).length;
      }

      // Check if this line ends the import (has 'from' and closes all braces)
      if (line.includes('from ') && depth <= 0) {
        lastImportEnd = i;
        inImport = false;
        depth = 0;
      }
      // Single line import
      if (line.startsWith('import ') && line.includes(' from ') && line.endsWith(';')) {
        lastImportEnd = i;
        inImport = false;
        depth = 0;
      }
    }

    // Stop after we're clearly past imports
    if (lastImportEnd > 0 && !inImport && i > lastImportEnd + 3) {
      const isImportRelated = line.startsWith('import') || line === '' || line.startsWith('//');
      if (!isImportRelated && line.length > 0) break;
    }
  }

  if (lastImportEnd === -1) {
    console.log(`  ERROR: Could not find last import`);
    continue;
  }

  // Insert useLocale import after the last complete import
  newLines.splice(lastImportEnd + 1, 0, 'import { useLocale } from "@/hooks/use-locale";');
  content = newLines.join('\n');

  // Step 4: Re-add const { t } = useLocale(); inside the component
  // Check if it already has it (from an earlier correct insertion)
  if (!content.includes('const { t } = useLocale()')) {
    const funcMatch = content.match(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/);
    if (funcMatch) {
      const funcEnd = content.indexOf(funcMatch[0]) + funcMatch[0].length;
      const before = content.substring(0, funcEnd);
      const after = content.substring(funcEnd);
      content = before + '\n  const { t } = useLocale();' + after;
    }
  }

  fs.writeFileSync(pagePath, content, 'utf-8');
  fixed++;
}

// Step 5: Fix academic-calendar form value issue
// The script replaced "Academic Calendar" in a form default value string
const acPath = path.join(dashboardDir, 'academic-calendar', 'page.tsx');
if (fs.existsSync(acPath)) {
  let acContent = fs.readFileSync(acPath, 'utf-8');
  // Fix: title: "{t("nav.academicCalendar")}" -> title: ""
  if (acContent.includes('title: "{t(\\"nav.academicCalendar\\")}')) {
    acContent = acContent.replace('title: "{t(\\"nav.academicCalendar\\")}', 'title: ""');
    fs.writeFileSync(acPath, acContent, 'utf-8');
    console.log('Fixed academic-calendar form value (escaped quotes)');
  } else if (acContent.includes('title: "{t("nav.academicCalendar")}')) {
    acContent = acContent.replace('title: "{t("nav.academicCalendar")}"', 'title: ""');
    fs.writeFileSync(acPath, acContent, 'utf-8');
    console.log('Fixed academic-calendar form value');
  }
}

console.log(`\nFixed ${fixed} files with broken imports`);