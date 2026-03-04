/**
 * Fix broken imports from first script and translate h1 titles that have icons.
 * The issue: import was inserted INSIDE a multi-line import block.
 * This script:
 *   1. Removes the incorrectly placed useLocale import
 *   2. Adds it correctly AFTER the last complete import statement
 *   3. Translates h1 titles that contain icons (e.g., <Icon /> Title Text)
 */
const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, '..', 'src', 'app', '(dashboard)');

const PAGES_TO_FIX = {
  'branding': { navKey: 'nav.branding', title: 'White-Label Branding' },
  'alumni': { navKey: 'nav.alumniNetwork', title: 'Alumni Network' },
  'academic-calendar': { navKey: 'nav.academicCalendar', title: 'Academic Calendar' },
  'staff-leave-calendar': { navKey: 'nav.staffLeaveCalendar', title: 'Staff Leave Calendar' },
  'student-performance': { navKey: 'nav.studentPerformance', title: 'Student Performance Tracker' },
  'teacher-evaluation': { navKey: 'nav.teacherEvaluation', title: 'Teacher Evaluation' },
  'documents': { navKey: 'nav.documents', title: 'Document Management' },
  'diary': { navKey: 'nav.studentDiary', title: 'Student Diary' },
  'inventory': { navKey: 'nav.inventory', title: 'Inventory & Asset Management' },
  'analytics': { navKey: 'nav.analytics', title: 'Analytics Dashboard' },
  'ai-insights': { navKey: 'nav.aiInsights', title: 'AI Attendance Insights' },
  'timetable-generator': { navKey: 'nav.timetableGenerator', title: 'Smart Timetable Generator' },
  'qr-attendance': { navKey: null, title: null },  // redirect only
};

let fixed = 0;

for (const [folder, { navKey, title }] of Object.entries(PAGES_TO_FIX)) {
  const pagePath = path.join(dashboardDir, folder, 'page.tsx');
  if (!fs.existsSync(pagePath)) {
    console.log(`SKIP (no file): ${folder}`);
    continue;
  }

  let content = fs.readFileSync(pagePath, 'utf-8');
  const lines = content.split('\n');

  // Step 1: Remove the broken import line
  const brokenImportIdx = lines.findIndex(l => l.trim() === 'import { useLocale } from "@/hooks/use-locale";');
  if (brokenImportIdx === -1) {
    console.log(`SKIP (no broken import found): ${folder}`);
    continue;
  }

  // Check if this import is inside another import block (broken)
  // A correct import should not be preceded by a line that starts with 'import {' without a closing '}'
  const prevLine = brokenImportIdx > 0 ? lines[brokenImportIdx - 1].trim() : '';
  const nextLine = brokenImportIdx < lines.length - 1 ? lines[brokenImportIdx + 1].trim() : '';
  const isBroken = (prevLine.startsWith('import {') && !prevLine.includes('from')) ||
                   (prevLine.startsWith('import') && !prevLine.includes('from') && !prevLine.endsWith(';'));

  // Remove the broken line
  lines.splice(brokenImportIdx, 1);

  // Also remove the const { t } = useLocale(); line that was injected
  const constLocaleIdx = lines.findIndex(l => l.trim() === 'const { t } = useLocale();');
  if (constLocaleIdx !== -1) {
    lines.splice(constLocaleIdx, 1);
  }

  content = lines.join('\n');

  // Step 2: Find the correct place to add the import
  // Find the last complete import statement (line ending with ';' after 'from') 
  const newLines = content.split('\n');
  let lastCompleteImportEnd = -1;
  let inImport = false;

  for (let i = 0; i < newLines.length; i++) {
    const line = newLines[i].trim();
    
    if (line.startsWith('import ')) {
      inImport = true;
    }
    
    if (inImport && (line.endsWith(';') || line.match(/from\s+["'][^"']+["'];?\s*$/))) {
      lastCompleteImportEnd = i;
      inImport = false;
    }
    
    // Also handle single-line imports
    if (line.startsWith('import ') && line.includes(' from ') && line.endsWith(';')) {
      lastCompleteImportEnd = i;
      inImport = false;
    }

    // Stop searching after we've passed the import block
    if (lastCompleteImportEnd > 0 && !inImport && line && !line.startsWith('import') && !line.startsWith('//') && !line.startsWith('}') && !line.startsWith('{') && !line.startsWith('*')) {
      if (i > lastCompleteImportEnd + 2) break;
    }
  }

  if (lastCompleteImportEnd === -1) {
    console.log(`ERROR: Could not find last import in ${folder}`);
    continue;
  }

  // Insert the import after the last complete import
  newLines.splice(lastCompleteImportEnd + 1, 0, 'import { useLocale } from "@/hooks/use-locale";');
  content = newLines.join('\n');

  // Step 3: Re-add const { t } = useLocale(); in the component
  const funcMatch = content.match(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/);
  if (funcMatch) {
    const funcEnd = content.indexOf(funcMatch[0]) + funcMatch[0].length;
    const before = content.substring(0, funcEnd);
    const after = content.substring(funcEnd);
    content = before + '\n  const { t } = useLocale();' + after;
  }

  // Step 4: Translate the h1 title if applicable
  if (title && navKey) {
    // Handle titles with icons: <Icon .../> Title Text
    // Pattern: >...Icon component... Title Text</h1>
    if (content.includes(title)) {
      content = content.replace(title, `{t("${navKey}")}`);
      console.log(`FIXED & TRANSLATED: ${folder}/page.tsx  "${title}" -> t("${navKey}")`);
    } else {
      // Try multiline - the title might be split across lines
      const titleWords = title.split(' ');
      const lastWord = titleWords[titleWords.length - 1];
      if (content.includes(lastWord)) {
        // Manual approach - just find and replace the title text wherever it appears near h1
        console.log(`NOTE: ${folder}/page.tsx - title "${title}" not found as exact string, check manually`);
      }
    }
  }

  fs.writeFileSync(pagePath, content, 'utf-8');
  fixed++;
}

console.log(`\nFixed ${fixed} files`);
