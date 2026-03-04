/**
 * Script to add useLocale import and translate page titles across all dashboard pages.
 * Run: node scripts/add-i18n-to-pages.js
 */
const fs = require('fs');
const path = require('path');

// Map of folder name -> i18n nav key
const PAGE_NAV_MAP = {
  'departments': 'nav.departments',
  'subjects': 'nav.subjects',
  'exams': 'nav.exams',
  'timetable': 'nav.timetable',
  'rooms': 'nav.rooms',
  'transport': 'nav.transport',
  'library': 'nav.library',
  'hostel': 'nav.hostel',
  'leaves': 'nav.leaves',
  'holidays': 'nav.holidays',
  'reports': 'nav.reports',
  'notifications': 'nav.notifications',
  'events': 'nav.events',
  'messages': 'nav.messages',
  'profile': 'nav.profile',
  'visitors': 'nav.visitors',
  'salary': 'nav.salary',
  'circulars': 'nav.circulars',
  'bulk-messages': 'nav.bulkMessages',
  'users': 'nav.userManagement',
  'backup': 'nav.backup',
  'billing': 'nav.billing',
  'branding': 'nav.branding',
  'alumni': 'nav.alumniNetwork',
  'academic-calendar': 'nav.academicCalendar',
  'staff-leave-calendar': 'nav.staffLeaveCalendar',
  'student-performance': 'nav.studentPerformance',
  'teacher-evaluation': 'nav.teacherEvaluation',
  'documents': 'nav.documents',
  'diary': 'nav.studentDiary',
  'emergency': 'nav.emergency',
  'inventory': 'nav.inventory',
  'faculty-workload': 'nav.facultyWorkload',
  'analytics': 'nav.analytics',
  'ai-insights': 'nav.aiInsights',
  'timetable-generator': 'nav.timetableGenerator',
  'online-exams': 'nav.onlineExams',
  'assignments': 'nav.assignments',
  'academic-years': 'nav.academicYears',
  'semesters': 'nav.semesters',
  'promotions': 'nav.promotion',
  'parent': 'nav.parentPortal',
  'roles': 'nav.roles',
  'audit-logs': 'nav.auditLogs',
  'qr-attendance': 'nav.qrAttendance',
  'teacher-attendance': 'nav.teacherAttendance',
  'subject-attendance': 'nav.subjectAttendance',
};

const dashboardDir = path.join(__dirname, '..', 'src', 'app', '(dashboard)');

// Already handled pages - skip these
const SKIP = new Set(['dashboard', 'students', 'teachers', 'attendance', 'fees', 'settings']);

let updated = 0;
let skipped = 0;
let errors = [];

for (const [folder, navKey] of Object.entries(PAGE_NAV_MAP)) {
  if (SKIP.has(folder)) {
    skipped++;
    continue;
  }

  const pagePath = path.join(dashboardDir, folder, 'page.tsx');
  if (!fs.existsSync(pagePath)) {
    console.log(`SKIP (no file): ${folder}/page.tsx`);
    skipped++;
    continue;
  }

  let content = fs.readFileSync(pagePath, 'utf-8');

  // Skip if already has useLocale
  if (content.includes('useLocale')) {
    console.log(`SKIP (already has useLocale): ${folder}/page.tsx`);
    skipped++;
    continue;
  }

  // 1. Add the import for useLocale
  // Find the last import line and add after it
  const importLines = content.split('\n');
  let lastImportIndex = -1;
  for (let i = 0; i < importLines.length; i++) {
    const line = importLines[i].trim();
    if (line.startsWith('import ') || line.startsWith('} from ')) {
      lastImportIndex = i;
    }
    // Stop at first non-import, non-empty that isn't a continuation
    if (lastImportIndex > 0 && i > lastImportIndex + 1 && line && !line.startsWith('import') && !line.startsWith('}') && !line.startsWith('//')) {
      break;
    }
  }

  if (lastImportIndex === -1) {
    errors.push(`${folder}: Could not find import block`);
    continue;
  }

  // Insert useLocale import after last import
  importLines.splice(lastImportIndex + 1, 0, 'import { useLocale } from "@/hooks/use-locale";');
  content = importLines.join('\n');

  // 2. Add const { t } = useLocale() at start of component function
  // Find patterns like "export default function XxxPage()" or "export default function Xxx()"
  const funcMatch = content.match(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/);
  if (funcMatch) {
    const funcEnd = content.indexOf(funcMatch[0]) + funcMatch[0].length;
    // Insert after the opening brace
    const before = content.substring(0, funcEnd);
    const after = content.substring(funcEnd);
    content = before + '\n  const { t } = useLocale();' + after;
  } else {
    errors.push(`${folder}: Could not find component function`);
    continue;
  }

  // 3. Replace the h1 text with translated version
  // Match patterns like: <h1 className="...">Some Text</h1>
  const h1Regex = /<h1\s+className="[^"]*">\s*([^<{]+?)\s*<\/h1>/;
  const h1Match = content.match(h1Regex);
  if (h1Match) {
    const originalH1 = h1Match[0];
    const h1Text = h1Match[1].trim();
    const translatedH1 = originalH1.replace(h1Text, `{t("${navKey}")}`);
    content = content.replace(originalH1, translatedH1);
    console.log(`UPDATED: ${folder}/page.tsx  "${h1Text}" -> t("${navKey}")`);
  } else {
    // Try multiline h1
    const h1Regex2 = /<h1\s+className="[^"]*">\n\s*([^<{]+?)\n\s*<\/h1>/;
    const h1Match2 = content.match(h1Regex2);
    if (h1Match2) {
      const originalH1 = h1Match2[0];
      const h1Text = h1Match2[1].trim();
      const newH1 = originalH1.replace(h1Text, `{t("${navKey}")}`);
      content = content.replace(originalH1, newH1);
      console.log(`UPDATED: ${folder}/page.tsx  "${h1Text}" -> t("${navKey}")`);
    } else {
      // Try h1 without className
      const h1Regex3 = /<h1[^>]*>([^<{]+?)<\/h1>/;
      const h1Match3 = content.match(h1Regex3);
      if (h1Match3) {
        const originalH1 = h1Match3[0];
        const h1Text = h1Match3[1].trim();
        const newH1 = originalH1.replace(h1Text, `{t("${navKey}")}`);
        content = content.replace(originalH1, newH1);
        console.log(`UPDATED: ${folder}/page.tsx  "${h1Text}" -> t("${navKey}")`);
      } else {
        console.log(`NOTE: ${folder}/page.tsx - no h1 found, import added only`);
      }
    }
  }

  // 4. Also try to translate page description (p tag right after h1)
  // This is optional - just the h1 is the main thing

  fs.writeFileSync(pagePath, content, 'utf-8');
  updated++;
}

console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors.length}`);
if (errors.length) {
  console.log('Errors:', errors);
}
