# EduTrack — Feature Status & Roadmap

## ✅ Implemented Features (43 modules)

### Core

| Module                  | API | UI  | Notes                           |
| ----------------------- | --- | --- | ------------------------------- |
| Login / Logout          | ✅  | ✅  | JWT + NextAuth, role-based      |
| Registration            | ✅  | ✅  | Multi-step, school creation     |
| Forgot / Reset Password | ✅  | ✅  | Email token flow                |
| Email Verification      | ✅  | —   | API-only                        |
| Subscription Plans      | ✅  | ✅  | Plan selection + feature gating |
| Dashboard               | —   | ✅  | Stats overview                  |
| Profile                 | ✅  | ✅  | Edit own profile                |
| Settings                | ✅  | ✅  | School settings                 |
| User Management         | ✅  | ✅  | CRUD + role assignment          |
| Custom Roles (RBAC)     | ✅  | ✅  | Per-menu CRUD permissions       |

### People

| Module               | API | UI  | Notes                        |
| -------------------- | --- | --- | ---------------------------- |
| Students             | ✅  | ✅  | CRUD + class-wise listing    |
| Student Import (CSV) | ✅  | ✅  | Bulk import                  |
| Teachers             | ✅  | ✅  | CRUD + subject/class mapping |
| Visitors             | ✅  | ✅  | Log + checkout               |

### Attendance

| Module                  | API | UI  | Notes                         |
| ----------------------- | --- | --- | ----------------------------- |
| Student Attendance      | ✅  | ✅  | Mark / History / QR sub-pages |
| QR Attendance           | ✅  | ✅  | Token generation + scan       |
| Teacher Attendance      | ✅  | ✅  | Daily attendance              |
| Subject-wise Attendance | ✅  | ✅  | Per-subject tracking          |

### Academics

| Module           | API | UI  | Notes                      |
| ---------------- | --- | --- | -------------------------- |
| Academic Years   | ✅  | ✅  | Yearly sessions            |
| Semesters        | ✅  | ✅  | Semester management        |
| Departments      | ✅  | ✅  | Department CRUD            |
| Subjects         | ✅  | ✅  | Curriculum subjects        |
| Timetable        | ✅  | ✅  | Weekly schedule            |
| Exams & Grades   | ✅  | ✅  | Create exams, enter grades |
| Promotions       | ✅  | ✅  | Class promotion            |
| Faculty Workload | ✅  | ✅  | Teaching hours tracking    |

### Finance

| Module | API | UI  | Notes                     |
| ------ | --- | --- | ------------------------- |
| Fees   | ✅  | ✅  | Structure + payments      |
| Salary | ✅  | ✅  | Teacher salary management |

### Facilities

| Module    | API | UI  | Notes                |
| --------- | --- | --- | -------------------- |
| Rooms     | ✅  | ✅  | Room CRUD + booking  |
| Transport | ✅  | ✅  | Routes + vehicles    |
| Library   | ✅  | ✅  | Books + issue/return |
| Hostel    | ✅  | ✅  | Rooms + allocations  |

### Operations

| Module           | API | UI  | Notes                  |
| ---------------- | --- | --- | ---------------------- |
| Leaves           | ✅  | ✅  | Apply + approve/reject |
| Holidays         | ✅  | ✅  | Holiday calendar       |
| Emergency Alerts | ✅  | ✅  | Broadcast alerts       |
| Notifications    | ✅  | ✅  | SSE real-time stream   |
| Reports          | ✅  | ✅  | Monthly + PDF export   |
| Backup & Restore | ✅  | ✅  | Database backup        |

### Infrastructure

| Module        | API | Notes                        |
| ------------- | --- | ---------------------------- |
| Health Check  | ✅  | Uptime monitoring            |
| i18n          | ✅  | Internationalization support |
| File Upload   | ✅  | Image/document uploads       |
| Data Export   | ✅  | CSV/Excel per entity         |
| Audit Logging | ✅  | Auto-logs all CUD operations |
| Rate Limiting | ✅  | API abuse protection         |

---

## ⏳ Pending Improvements (built but can be enhanced)

| #   | Feature                      | Current State                | What's Needed                                  |
| --- | ---------------------------- | ---------------------------- | ---------------------------------------------- |
| 1   | **Student Photos**           | Text-only profile            | Add image upload to student form               |
| 2   | **Teacher Photos**           | Text-only profile            | Add image upload to teacher form               |
| 3   | **Report Cards**             | Exam grades exist            | Generate formatted PDF report cards            |
| 4   | **Fee Receipts**             | Payment records exist        | Generate PDF fee receipts                      |
| 5   | **Attendance Reports PDF**   | Monthly API exists           | Per-student detailed PDF                       |
| 6   | **Email Notifications**      | Mailer module exists         | Wire to leave approvals, fee reminders         |
| 7   | **Dashboard Charts**         | Basic stats cards            | Add graphs (attendance trends, fee collection) |
| 8   | **Bulk Teacher Import**      | CSV import for students only | Extend to teachers                             |
| 9   | **Holidays Auto-block**      | Holiday CRUD exists          | Auto-skip attendance on holidays               |
| 10  | **Timetable Conflict Check** | Basic timetable CRUD         | Prevent overlapping slots                      |

---

## ❌ Missing Features (not yet built)

| #   | Feature                          | Priority | Effort                                                                           |
| --- | -------------------------------- | -------- | -------------------------------------------------------------------------------- |
| 1   | **Parent Portal**                | High     | Large — separate role + pages for parents to view child attendance, grades, fees |
| 2   | **SMS Integration**              | High     | Medium — Twilio/MSG91 for attendance alerts, fee reminders                       |
| 3   | **Online Fee Payment**           | High     | Medium — Razorpay/Stripe gateway integration                                     |
| 4   | **Mobile App / PWA**             | High     | Large — responsive PWA or React Native app                                       |
| 5   | **Assignment / Homework**        | Medium   | Medium — teachers assign, students submit                                        |
| 6   | **Online Exam (MCQ)**            | Medium   | Large — question bank, timed tests, auto-grading                                 |
| 7   | **Chat / Messaging**             | Medium   | Medium — teacher-parent, admin-teacher messaging                                 |
| 8   | **Event Calendar**               | Medium   | Small — school events, PTMs, sports days                                         |
| 9   | **Circular / Announcements**     | Medium   | Small — broadcast notices with attachments                                       |
| 10  | **Bulk SMS/Email**               | Medium   | Small — mass communication to parents/teachers                                   |
| 11  | **Student Transfer Certificate** | Low      | Small — generate TC PDF                                                          |
| 12  | **ID Card Generator**            | Low      | Small — PDF ID cards with photos                                                 |
| 13  | **Attendance Biometric**         | Low      | Medium — fingerprint/RFID integration                                            |
| 14  | **Multi-language UI**            | Low      | Medium — i18n API exists, need UI translations                                   |
| 15  | **Dark Mode**                    | Low      | Small — theme toggle exists, need full theme support                             |

---

## 💡 Suggestions for New Features

### High Impact

1. **Parent Mobile App** — Let parents check attendance, fees, grades, and communicate with teachers from their phone. Biggest user-facing value add.
2. **WhatsApp Integration** — Send daily attendance, fee due, exam results via WhatsApp Business API. Higher open rate than SMS/email.
3. **Analytics Dashboard** — Visual charts: attendance trends, class performance, fee collection rates, teacher workload distribution.
4. **Automated Fee Reminders** — CRON job that sends SMS/email/WhatsApp on due dates and overdue fees.

### Medium Impact

5. **Student Performance Tracker** — Track exam scores across semesters with trend graphs and rank lists.
6. **Teacher Evaluation** — Feedback forms from students/parents with aggregate scores.
7. **Smart Timetable Generator** — Auto-generate conflict-free timetables based on teacher availability and room capacity.
8. **Document Management** — Upload and manage student documents (birth certificate, Aadhaar, previous TC).
9. **Inventory Management** — Track school assets, lab equipment, sports equipment.

### Nice to Have

10. **AI Attendance Insights** — Predict students at risk of dropping out based on attendance patterns.
11. **Multi-branch Support** — Manage multiple school branches from one admin account.
12. **API Webhooks** — Let third-party tools subscribe to events (new student, fee paid, etc.).
13. **Student Diary** — Daily homework/notes that parents can view.
14. **CCTV Integration** — View live camera feeds from dashboard.

---

## 📊 Current Stats

| Metric             | Count                                  |
| ------------------ | -------------------------------------- |
| Dashboard Pages    | 35                                     |
| API Routes         | 47                                     |
| Mongoose Models    | 34                                     |
| UI Components      | 20                                     |
| Zod Validators     | 40+ schemas                            |
| Permission Strings | 53                                     |
| Default Roles      | 4 (Super Admin, Admin, Teacher, Staff) |
| Plan-gated Modules | 29                                     |

---

_Last updated: January 2025_
