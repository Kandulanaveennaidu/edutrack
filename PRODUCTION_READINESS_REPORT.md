# EduTrack — Production Readiness & Go-to-Market Report

### School & College Attendance Management System

**Prepared:** February 6, 2026 | **Version:** 1.0 | **Confidential**

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Application Gap Analysis](#2-application-gap-analysis)
3. [Production Readiness Recommendations](#3-production-readiness-recommendations)
4. [Market Research & Opportunity](#4-market-research--opportunity)
5. [Client Acquisition Strategy](#5-client-acquisition-strategy)
6. [Client Onboarding Process](#6-client-onboarding-process)
7. [Marketing Plan](#7-marketing-plan)
8. [Sales & Onboarding Tracker](#8-sales--onboarding-tracker)
9. [Roadmap & Timeline](#9-roadmap--timeline)
10. [Appendix: Templates](#10-appendix-templates)

---

## 1. EXECUTIVE SUMMARY

### What EduTrack Is

EduTrack is a cloud-based, multi-tenant School & College Attendance Management System built on Next.js 14, MongoDB, and Tailwind CSS. It supports role-based access for admins and teachers, real-time notifications (SSE), QR-based attendance, leave management, room booking, emergency alerts, visitor tracking, timetable management, and automated email notifications.

### Current State Assessment

| Dimension                        | Score    | Verdict                                                        |
| -------------------------------- | -------- | -------------------------------------------------------------- |
| Feature Completeness             | 7/10     | Core features solid; some stubs                                |
| Security                         | 4/10     | Auth works; missing rate limiting, CSP, validation enforcement |
| Database Design                  | 6/10     | Good structure; string dates, no cascades                      |
| Code Quality                     | 6/10     | Clean patterns; legacy dead code, inconsistency                |
| Scalability                      | 4/10     | No caching, SSE polling bottleneck                             |
| Test Coverage                    | 0/10     | Zero test files exist                                          |
| **Overall Production Readiness** | **4/10** | **NOT production-ready**                                       |

### Verdict

> **EduTrack cannot onboard paying clients today.** It requires 4-6 weeks of focused engineering work to address 10 critical blockers before a production launch. The core product architecture is sound, the feature set is competitive for the Indian K-12 market, and the market opportunity is massive (USD 32B+ globally by 2030). With the fixes outlined below, EduTrack can begin onboarding pilot clients within 6-8 weeks.

---

## 2. APPLICATION GAP ANALYSIS

### 2.1 Feature Inventory

| #   | Feature                            | Status             | Notes                                                             |
| --- | ---------------------------------- | ------------------ | ----------------------------------------------------------------- |
| 1   | School Registration & Onboarding   | ✅ Complete        | Creates school + admin user, sends emails                         |
| 2   | User Authentication (Login/Logout) | ✅ Complete        | JWT sessions, 24h TTL                                             |
| 3   | Email Verification                 | ✅ Complete        | Token-based, 24h expiry                                           |
| 4   | Password Reset                     | ✅ Complete        | Email-based, 1h expiry                                            |
| 5   | Role-Based Access Control          | ⚠️ Partial         | Permission helpers defined but not used in routes                 |
| 6   | Student CRUD                       | ⚠️ Partial         | List/Create use MongoDB; `students/[id]` still uses Google Sheets |
| 7   | Teacher CRUD                       | ✅ Complete        | All operations on MongoDB                                         |
| 8   | Attendance Marking                 | ✅ Complete        | Bulk upsert, auto absent/late notifications                       |
| 9   | Today's Attendance Dashboard       | ✅ Complete        | Stats + 7-day trend chart                                         |
| 10  | QR Code Attendance                 | ✅ Complete        | Token generate, scan, auto-expiry                                 |
| 11  | Monthly Reports                    | ✅ Complete        | Per-student breakdown with percentages                            |
| 12  | Leave Management                   | ✅ Complete        | Submit/Approve/Reject with notifications                          |
| 13  | Real-time Notifications            | ✅ Complete        | CRUD + SSE stream + read tracking                                 |
| 14  | Visitor Management                 | ✅ Complete        | Pre-register, check-in/out, badges                                |
| 15  | Room Management & Booking          | ✅ Complete        | Conflict detection                                                |
| 16  | Holiday Management                 | ✅ Complete        | CRUD, duplicate prevention                                        |
| 17  | Timetable Management               | ✅ Complete        | Slot + teacher conflict detection                                 |
| 18  | Emergency Alerts                   | ✅ Complete        | Broadcast with severity, resolve                                  |
| 19  | Settings (Key-Value)               | ✅ Complete        | Per-school bulk upsert                                            |
| 20  | Profile Management                 | ✅ Complete        | View/update profile                                               |
| 21  | Email System (SMTP)                | ✅ Complete        | 7 HTML templates, Gmail SMTP verified                             |
| 22  | Student Bulk Import (CSV/Excel)    | 🔴 Not Implemented | xlsx dependency installed but no code                             |
| 23  | PDF Report Export                  | 🔴 Not Implemented | jspdf dependency installed but no code                            |
| 24  | Data Export (CSV/Excel)            | 🔴 Not Implemented | No export anywhere                                                |
| 25  | Parent Portal / SMS                | 🔴 Not Implemented | No parent-facing features                                         |
| 26  | Mobile App                         | 🔴 Not Implemented | Web only, not responsive-optimized                                |
| 27  | Fee Management                     | 🔴 Not Implemented | Major gap vs competitors                                          |
| 28  | Exam/Results Management            | 🔴 Not Implemented | Major gap vs competitors                                          |

### 2.2 Critical Bugs Found

| #   | Bug                                                                          | Severity    | Impact                                |
| --- | ---------------------------------------------------------------------------- | ----------- | ------------------------------------- |
| 1   | `students/[id]` routes (GET/PUT/DELETE) still use Google Sheets, not MongoDB | 🔴 Critical | Individual student operations broken  |
| 2   | Debug endpoint (`/api/debug`) exposes session data publicly                  | 🔴 Critical | Security vulnerability                |
| 3   | `NEXTAUTH_SECRET` set to weak value `edutrack-secret-key-2026`               | 🔴 Critical | Session tokens can be forged          |
| 4   | Zod validators defined but only used in 1 of 17 API routes                   | 🔴 High     | Input validation is ineffective       |
| 5   | `requireAuth()`/`requireRole()` helpers exist but are never called           | 🟡 Medium   | Inconsistent authorization            |
| 6   | SSE notification stream polls MongoDB every 5s per connected client          | 🟡 Medium   | Won't scale past ~50 concurrent users |
| 7   | No pagination on teachers, leaves, visitors, notifications, attendance       | 🟡 Medium   | Performance degrades with data growth |
| 8   | 806 lines of dead Google Sheets code still in codebase                       | 🟢 Low      | Maintenance burden                    |

### 2.3 Security Gaps

| Gap                     | Risk Level  | Current State             | Required State                              |
| ----------------------- | ----------- | ------------------------- | ------------------------------------------- |
| Rate Limiting           | 🔴 Critical | None on any endpoint      | 5 attempts/min on auth; 100 req/min general |
| Input Validation        | 🔴 Critical | Zod schemas exist, unused | All POST/PUT routes must validate           |
| Content Security Policy | 🔴 High     | No CSP headers            | Strict CSP via Next.js middleware           |
| Account Lockout         | 🔴 High     | None                      | Lock after 5 failed attempts                |
| Audit Logging           | 🟡 Medium   | None                      | Log all create/update/delete operations     |
| Data Encryption (PII)   | 🟡 Medium   | Plaintext storage         | Encrypt parent phone, address at rest       |
| HTTPS Enforcement       | 🟡 Medium   | Not configured            | HSTS header, secure cookies                 |
| Password Complexity     | 🟡 Medium   | 6-char minimum only       | 8+ chars, uppercase, number, symbol         |

---

## 3. PRODUCTION READINESS RECOMMENDATIONS

### 3.1 Architecture Improvements (Priority Order)

#### P0 — Must Fix Before Any Client (Weeks 1-2)

```
1. Migrate students/[id] routes from Google Sheets to MongoDB
2. Delete /api/debug endpoint
3. Generate cryptographically strong NEXTAUTH_SECRET
4. Add rate limiting middleware (next-rate-limit or custom)
5. Apply Zod validation to ALL API routes
6. Use requireAuth()/requireRole() consistently
7. Add health check endpoint (/api/health)
8. Fix password policy (8+ chars, complexity requirements)
9. Remove legacy Google Sheets code (google-sheets.ts, setup-sheets.js)
10. Add security headers (CSP, HSTS, X-Frame-Options) via middleware.ts
```

#### P1 — Must Fix Before Production Launch (Weeks 3-4)

```
11. Add structured logging (Pino or Winston)
12. Add error monitoring (Sentry)
13. Implement pagination on all list endpoints
14. Add database backup automation (MongoDB Atlas scheduled backups)
15. Set up CI/CD pipeline (GitHub Actions → Vercel/Railway)
16. Implement account lockout after failed login attempts
17. Add audit trail for CRUD operations
18. Implement student bulk import (CSV/Excel)
19. Add data export functionality (CSV downloads)
20. Write critical-path tests (auth, attendance, student CRUD)
```

#### P2 — Should Fix Before Scale (Weeks 5-8)

```
21. Replace SSE polling with WebSocket or Redis Pub/Sub
22. Add Redis caching for frequently-read data (settings, student lists)
23. Implement PDF report generation
24. Add API documentation (Swagger/OpenAPI)
25. Implement multi-language support (Hindi, Telugu, etc.)
26. Build parent notification portal (read-only view)
27. Optimize MongoDB queries (aggregation pipelines, indexes)
28. Add comprehensive test suite (unit + integration + E2E)
```

### 3.2 Recommended Tech Stack Additions

| Purpose          | Tool                 | Monthly Cost           |
| ---------------- | -------------------- | ---------------------- |
| Hosting          | Vercel Pro           | $20/month              |
| Database         | MongoDB Atlas M10    | $57/month              |
| Error Monitoring | Sentry (Developer)   | Free                   |
| Logging          | Axiom / Logtail      | Free tier              |
| Email            | Gmail SMTP (current) | Free (500/day limit)   |
| Email (Scale)    | Resend or SendGrid   | $20/month (50K emails) |
| Cache            | Upstash Redis        | $10/month              |
| File Storage     | Cloudflare R2        | ~$5/month              |
| CI/CD            | GitHub Actions       | Free (2,000 min/month) |
| SSL/Domain       | Cloudflare           | Free                   |
| **Total**        |                      | **~$112/month**        |

### 3.3 Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTS                                │
│    Browser / Mobile Browser / Future Mobile App               │
└──────────────────┬───────────────────────────────────────────┘
                   │ HTTPS
┌──────────────────▼───────────────────────────────────────────┐
│                   Cloudflare (CDN + SSL + DDoS)               │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                   Vercel Edge Network                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Static SSR  │  │ API Routes  │  │ Middleware            │ │
│  │ (Pages)     │  │ (Serverless)│  │ (Rate Limit + Auth)   │ │
│  └─────────────┘  └──────┬──────┘  └──────────────────────┘ │
└──────────────────────────┼───────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
┌────────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│ MongoDB Atlas │  │ Upstash Redis│  │ Gmail SMTP   │
│ (M10 Cluster) │  │ (Cache/PubSub│  │ → SendGrid   │
│               │  │  + Sessions) │  │              │
└───────────────┘  └──────────────┘  └──────────────┘
```

---

## 4. MARKET RESEARCH & OPPORTUNITY

### 4.1 Market Size

| Metric                   | Value                   | Source              |
| ------------------------ | ----------------------- | ------------------- |
| Global SIS Market (2023) | USD 8.86 Billion        | Grand View Research |
| Projected by 2030        | USD 32.38 Billion       | Grand View Research |
| CAGR (2023-2030)         | 20.3%                   | Grand View Research |
| Asia Pacific CAGR        | 22.5% (Fastest growing) | Grand View Research |
| Cloud Deployment Share   | 62.6% (2022)            | Grand View Research |
| K-12 Segment CAGR        | 20.0%                   | Grand View Research |

### 4.2 India-Specific Market

| Metric                        | Value                             |
| ----------------------------- | --------------------------------- |
| Total Schools in India        | 1.5 million+ (UDISE+ 2023-24)     |
| Private Schools               | ~450,000                          |
| Higher Education Institutions | 58,000+ (UGC)                     |
| Schools with Digital Systems  | <15% (opportunity)                |
| Government Push               | NEP 2020 — 50% GER target by 2035 |
| Ed-tech Market India          | USD 7.5B by 2025 (IAMAI)          |

### 4.3 Target Segments (Prioritized)

| Priority | Segment                                     | Size (India) | Willingness to Pay    | Complexity |
| -------- | ------------------------------------------- | ------------ | --------------------- | ---------- |
| 🥇 P1    | Private K-12 Schools (200-2000 students)    | ~300,000     | High (₹50K-2L/yr)     | Low        |
| 🥈 P2    | CBSE/ICSE Schools                           | ~30,000      | High                  | Medium     |
| 🥉 P3    | Coaching Institutes (Engineering/Medical)   | ~50,000      | Medium (₹30K-1L/yr)   | Low        |
| P4       | Private Colleges (Arts/Science/Engineering) | ~15,000      | High (₹1-5L/yr)       | High       |
| P5       | International Schools (IB/Cambridge)        | ~1,000       | Very High (₹2-10L/yr) | Medium     |
| P6       | Government Schools (State Board)            | ~1,000,000   | Low (tender-based)    | Very High  |

### 4.4 Competitor Analysis

| Competitor            | Type              | Pricing (India)    | Key Strengths                           | Key Weaknesses                | EduTrack Advantage            |
| --------------------- | ----------------- | ------------------ | --------------------------------------- | ----------------------------- | ----------------------------- |
| **Fedena** (Foradian) | Full ERP          | ₹50K-5L/yr         | Complete school ERP, open-source option | Heavy, complex setup          | Simpler UX, faster onboarding |
| **MyClassboard**      | Full ERP          | ₹2-8/student/month | Strong in AP/TS region, mobile app      | Expensive at scale            | Lower price, modern UI        |
| **Teachmint**         | Teaching Platform | Free-₹3L/yr        | Large user base, free tier, app         | Attendance is not core focus  | Attendance-first + dedicated  |
| **Skolaro**           | School ERP        | ₹1-3/student/month | Integrated SMS, Android app             | Dated UI                      | Modern stack, better DX       |
| **EnterpriseMINE**    | ERP               | ₹50K-2L/yr         | Full ERP including fees                 | Complex, enterprise-focused   | Lean, quick to deploy         |
| **Google Classroom**  | Free              | Free               | Massive adoption                        | No attendance, no admin tools | Dedicated admin features      |
| **Manual Registers**  | Paper             | ₹500/yr            | No training needed                      | No analytics, no automation   | Full automation + analytics   |

### 4.5 EduTrack's Competitive Positioning

**Category:** Lightweight Attendance Management System (Not a full ERP)

**Unique Value Proposition:**

> "EduTrack replaces your paper attendance register with a smart, cloud-based system — set up in 10 minutes, not 10 weeks. Get real-time attendance tracking, instant parent notifications, QR-based check-in, and monthly reports — all from ₹2,999/month."

**Key Differentiators:**

1. **Attendance-first** — Not a bloated ERP; does one thing exceptionally well
2. **10-minute setup** — Self-service registration, pre-configured
3. **QR attendance** — Modern, contactless marking
4. **Real-time parent alerts** — Instant absent/late notifications via email
5. **Emergency broadcasts** — Safety-first feature unique to this segment
6. **Modern UI** — Built with modern tech (Next.js, Tailwind), not legacy PHP

### 4.6 Pricing Strategy

#### Recommended Pricing Model: Per-School Monthly Subscription

| Plan           | Students    | Price (Monthly) | Price (Annual) | Savings |
| -------------- | ----------- | --------------- | -------------- | ------- |
| **Starter**    | Up to 200   | ₹2,999          | ₹29,990        | 17%     |
| **Growth**     | Up to 500   | ₹5,999          | ₹59,990        | 17%     |
| **Pro**        | Up to 1,500 | ₹9,999          | ₹99,990        | 17%     |
| **Enterprise** | Unlimited   | Custom          | Custom         | Custom  |

#### What's Included (All Plans):

- ✅ Unlimited teachers & admin users
- ✅ Attendance marking (manual + QR)
- ✅ Real-time notifications
- ✅ Monthly reports & analytics
- ✅ Leave management
- ✅ Emergency alerts
- ✅ Email support

#### Pro & Enterprise Extras:

- ✅ Priority support (WhatsApp + Phone)
- ✅ Custom branding (school logo)
- ✅ API access
- ✅ Bulk student import
- ✅ PDF reports export
- ✅ Dedicated account manager (Enterprise)

#### Free Trial Strategy:

- **30-day free trial** on Growth plan (no credit card required)
- During trial: 3 onboarding check-in calls
- After trial: Convert with 20% first-year discount

---

## 5. CLIENT ACQUISITION STRATEGY

### 5.1 Target Client Profile (ICP — Ideal Customer Profile)

```
School Type:     Private K-12 (CBSE/ICSE/State Board)
Size:            200-2,000 students
Location:        Tier 1, 2, 3 cities in India
Decision Maker:  Principal / Director / Administrator / School Owner
Pain Points:     Manual attendance taking 30+ min/day
                 No parent communication system
                 Government compliance reporting tedious
                 No attendance analytics for performance tracking
Annual Budget:   ₹50K - ₹5L for software
Tech Readiness:  Uses smartphones; has basic internet; may or may not
                 have existing school ERP
```

### 5.2 Outreach Channels (Ranked by ROI)

| Channel                                   | Effort | Cost             | Expected Conversion |
| ----------------------------------------- | ------ | ---------------- | ------------------- |
| 1. **Direct School Visits (Local)**       | High   | Low (travel)     | 15-25%              |
| 2. **WhatsApp Business Outreach**         | Medium | Free             | 5-10%               |
| 3. **Google Ads (Search)**                | Medium | ₹15K-50K/month   | 3-5%                |
| 4. **School Management Conferences**      | High   | ₹25K-1L/event    | 10-20%              |
| 5. **Facebook/Instagram Ads**             | Low    | ₹10K-30K/month   | 2-4%                |
| 6. **LinkedIn (DM to Principals)**        | Medium | Free-₹5K/month   | 3-8%                |
| 7. **Education Association Partnerships** | Medium | Revenue share    | 10-15%              |
| 8. **Referral Program**                   | Low    | ₹5K per referral | 20-30%              |
| 9. **YouTube (Product Demos)**            | Medium | Free             | Brand building      |
| 10. **SEO / Blog Content**                | Medium | Free             | Long-term 5-10%     |

### 5.3 Partnership Opportunities

| Partner Type                | Examples                                                          | Value Exchange                              |
| --------------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| **School Associations**     | CBSE School Mgmt Committee, ICSE Council, State SAHODAYA clusters | Endorsed vendor status → bulk school access |
| **Education Consultants**   | Local school management consultants                               | 15-20% referral commission                  |
| **Hardware Vendors**        | Biometric/CCTV installers, computer labs                          | Bundle EduTrack with hardware packages      |
| **Stationery Distributors** | School supply chains                                              | Include EduTrack flyers with deliveries     |
| **PTA Networks**            | Parent-Teacher Association groups                                 | Bottom-up adoption through parents          |
| **Government Programs**     | State digitization initiatives, Samagra Shiksha                   | Apply as empaneled vendor                   |

### 5.4 Lead Generation Tactics

**Inbound:**

1. **Free Attendance Calculator Tool** — "How much time does your school waste on manual attendance?" → Lead capture
2. **Free Compliance Checklist** — "Is your school attendance tracking UDISE+ compliant?" → Lead capture
3. **Webinar Series** — "Digital Attendance: Save 2 Hours Daily" → Monthly, 30-min sessions
4. **Blog/SEO** — Target: "school attendance management software", "best attendance app for schools India"

**Outbound:**

1. **Cold WhatsApp Messages** — Personalized video demo (2 min) sent to school WhatsApp numbers
2. **School Visit Kit** — Printed one-pager + live demo on tablet + 30-day trial activation on spot
3. **Email Campaigns** — 5-email sequence to principal databases (IndiaMART, JustDial leads)
4. **LinkedIn Sales Navigator** — Target: "Principal", "School Director", "School Administrator"

---

## 6. CLIENT ONBOARDING PROCESS

### 6.1 End-to-End Onboarding Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    ONBOARDING PIPELINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Day 0-1: SIGNUP & SETUP                                     │
│  ├── School self-registers at edutrack.app/register           │
│  ├── Admin account created + welcome email sent               │
│  ├── Email verification completed                             │
│  └── Onboarding specialist assigned                           │
│                                                              │
│  Day 1-3: DATA MIGRATION                                     │
│  ├── School uploads student CSV/Excel (bulk import)           │
│  ├── Teacher accounts created by admin                        │
│  ├── Classes & sections configured                            │
│  ├── Room setup (if applicable)                               │
│  ├── Holiday calendar imported                                │
│  └── Timetable configured                                     │
│                                                              │
│  Day 3-5: TRAINING                                           │
│  ├── Admin Training Session (60 min video call)               │
│  │   ├── Dashboard walkthrough                                │
│  │   ├── Student management                                   │
│  │   ├── Teacher onboarding                                   │
│  │   ├── Reports & analytics                                  │
│  │   └── Settings & customization                             │
│  ├── Teacher Training Session (30 min video call)             │
│  │   ├── Daily attendance marking                             │
│  │   ├── QR attendance setup                                  │
│  │   ├── Leave management                                     │
│  │   └── Notifications                                        │
│  └── Training recordings shared via email                     │
│                                                              │
│  Day 5-7: PILOT WEEK                                         │
│  ├── Parallel run: Paper + EduTrack for 5 school days         │
│  ├── Daily check-in message (WhatsApp) from support           │
│  └── Bug/feedback collection                                  │
│                                                              │
│  Day 7-14: GO LIVE                                           │
│  ├── Paper attendance discontinued                            │
│  ├── Parent notifications activated                           │
│  ├── Monthly report generation verified                       │
│  └── First monthly review call scheduled                      │
│                                                              │
│  Day 30: FIRST REVIEW                                        │
│  ├── Usage analytics reviewed                                 │
│  ├── Feedback collected                                       │
│  ├── Trial → Paid conversion (if trial)                       │
│  └── Referral program offered                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Required Documents

| Document                        | From     | To                | Purpose                                |
| ------------------------------- | -------- | ----------------- | -------------------------------------- |
| Service Agreement               | EduTrack | School            | Terms, pricing, data handling          |
| Data Processing Agreement (DPA) | EduTrack | School            | GDPR/DPDP Act compliance               |
| School Information Form         | School   | EduTrack          | Name, address, contacts, student count |
| Student Master Data (CSV)       | School   | EduTrack (upload) | Bulk student import                    |
| Teacher List (CSV)              | School   | EduTrack (upload) | Bulk teacher account creation          |
| Authorized Signatory Letter     | School   | EduTrack          | Confirms who can manage account        |
| Invoice/Receipt                 | EduTrack | School            | Payment confirmation                   |

### 6.3 SLA Commitments

| Metric                   | Target           | Measurement                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| Uptime                   | 99.5%            | Monthly, excluding scheduled maintenance |
| Response Time (Critical) | < 2 hours        | Login/attendance not working             |
| Response Time (High)     | < 8 hours        | Feature not working correctly            |
| Response Time (Medium)   | < 24 hours       | Questions, minor issues                  |
| Response Time (Low)      | < 72 hours       | Feature requests, suggestions            |
| Data Backup              | Daily automated  | MongoDB Atlas backup policy              |
| Data Recovery            | < 4 hours        | From latest backup point                 |
| Support Channels         | Email + WhatsApp | Mon-Sat, 9 AM - 6 PM IST                 |

---

## 7. MARKETING PLAN

### 7.1 Core Messaging

**Tagline Options:**

1. "Attendance made intelligent." (Primary)
2. "Every student counted. Every parent informed."
3. "From register books to real-time dashboards in 10 minutes."

**Elevator Pitch (30 seconds):**

> "EduTrack replaces your paper attendance register with a smart cloud system. Teachers mark attendance in under 2 minutes, parents get instant notifications if their child is absent or late, and principals see real-time analytics dashboards. It takes 10 minutes to set up, costs less than ₹100 per day, and works on any device with a browser."

**Key Messages by Audience:**

| Audience         | Pain Point                                   | EduTrack Message                                           |
| ---------------- | -------------------------------------------- | ---------------------------------------------------------- |
| **Principal**    | "I have no visibility into daily attendance" | "See school-wide attendance in real-time, From any device" |
| **Teacher**      | "Attendance takes 15-20 minutes of my class" | "Mark attendance for 40 students in under 2 minutes"       |
| **Parent**       | "I don't know if my child reached school"    | "Get instant SMS/email if your child is absent or late"    |
| **School Owner** | "We're not UDISE+ compliant"                 | "Automated reports for government compliance"              |

### 7.2 Content Calendar (First 3 Months)

#### Month 1: Launch & Awareness

| Week | Content                                                       | Channel                  | Goal           |
| ---- | ------------------------------------------------------------- | ------------------------ | -------------- |
| W1   | "Why Paper Attendance is Costing Your School ₹2L/year" (Blog) | Website, LinkedIn        | SEO, awareness |
| W1   | Product launch video (2 min)                                  | YouTube, Instagram       | Brand          |
| W2   | "5 Signs Your School Needs Digital Attendance" (Carousel)     | Instagram, Facebook      | Engagement     |
| W2   | Live Demo Webinar #1                                          | Zoom, promoted on social | Lead gen       |
| W3   | Principal testimonial video (from pilot)                      | LinkedIn, YouTube        | Trust          |
| W3   | "How to Set Up EduTrack in 10 Minutes" (Tutorial)             | YouTube                  | Onboarding     |
| W4   | Case study: "XYZ School saved 2 hours/day"                    | Blog, LinkedIn           | Conversion     |

#### Month 2: Lead Generation

| Week | Content                                                       | Channel              | Goal         |
| ---- | ------------------------------------------------------------- | -------------------- | ------------ |
| W5   | Free Attendance Audit Tool                                    | Website landing page | Lead capture |
| W5   | Google Ads campaign launch                                    | Google Search        | Leads        |
| W6   | "Attendance Analytics: What Your Data Tells You" (Blog)       | Website              | SEO          |
| W6   | WhatsApp outreach campaign (100 schools)                      | WhatsApp Business    | Direct       |
| W7   | Live Demo Webinar #2                                          | Zoom                 | Lead gen     |
| W7   | Instagram Reels: "Day in the Life of a Teacher with EduTrack" | Instagram            | Awareness    |
| W8   | Partnership announcement with education association           | LinkedIn, PR         | Authority    |

#### Month 3: Conversion & Scale

| Week | Content                                                  | Channel                 | Goal         |
| ---- | -------------------------------------------------------- | ----------------------- | ------------ |
| W9   | "Complete Guide to UDISE+ Attendance Compliance" (eBook) | Website                 | Lead magnet  |
| W10  | Facebook/Instagram retargeting ads                       | Social                  | Conversion   |
| W10  | Referral program launch                                  | Email to existing users | Viral        |
| W11  | School Visit Campaign (local, 20 schools)                | In-person               | Direct sales |
| W12  | Quarterly review + ROI report for pilot schools          | Email                   | Retention    |

### 7.3 Marketing KPIs

| KPI                             | Month 1 Target | Month 3 Target | Month 6 Target |
| ------------------------------- | -------------- | -------------- | -------------- |
| Website visitors                | 2,000          | 8,000          | 25,000         |
| Free trial signups              | 10             | 50             | 150            |
| Trial → Paid conversion         | 30%            | 40%            | 50%            |
| Active paying schools           | 3              | 20             | 75             |
| MRR (Monthly Recurring Revenue) | ₹15K           | ₹1L            | ₹4.5L          |
| CAC (Customer Acquisition Cost) | ₹5,000         | ₹3,000         | ₹2,000         |
| LTV (Lifetime Value)            | ₹72K           | ₹72K           | ₹72K           |
| LTV:CAC Ratio                   | 14:1           | 24:1           | 36:1           |
| NPS (Net Promoter Score)        | —              | 40+            | 50+            |
| Churn Rate (Monthly)            | —              | <5%            | <3%            |

### 7.4 Marketing Budget (First 6 Months)

| Item                          | Monthly      | 6-Month Total |
| ----------------------------- | ------------ | ------------- |
| Google Ads                    | ₹25,000      | ₹1,50,000     |
| Facebook/Instagram Ads        | ₹15,000      | ₹90,000       |
| Content Creation (Freelancer) | ₹10,000      | ₹60,000       |
| Webinar Infrastructure (Zoom) | ₹1,500       | ₹9,000        |
| School Visit Travel           | ₹5,000       | ₹30,000       |
| Conference Attendance (2x)    | —            | ₹50,000       |
| Referral Payouts              | ₹5,000       | ₹30,000       |
| **Total**                     | **~₹61,500** | **₹4,19,000** |

---

## 8. SALES & ONBOARDING TRACKER

### 8.1 Lead Pipeline Dashboard Structure

```
┌──────────────────────────────────────────────────────────────┐
│              EDUTRACK SALES DASHBOARD                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ LEADS    │ │ TRIALS   │ │ ACTIVE   │ │ MRR      │       │
│  │   47     │ │   12     │ │    5     │ │ ₹32,995  │       │
│  │ +8 this  │ │ +3 this  │ │ +2 this  │ │ +₹11,998 │       │
│  │   week   │ │   week   │ │   month  │ │ this mo  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  PIPELINE FUNNEL:                                            │
│  ██████████████████████████████  Cold Leads        (47)      │
│  █████████████████              Contacted          (28)      │
│  ███████████                    Demo Scheduled     (18)      │
│  ████████                       Demo Done          (14)      │
│  ██████                         Trial Started      (12)      │
│  ████                           Proposal Sent       (8)      │
│  ███                            Negotiation         (6)      │
│  ██                             Won (Active)        (5)      │
│  █                              Lost                (3)      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Lead Tracking Sheet Columns

| Column                    | Type     | Values                                                                                           |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| Lead ID                   | Auto     | L-001, L-002...                                                                                  |
| School Name               | Text     | —                                                                                                |
| City / State              | Text     | —                                                                                                |
| Board                     | Dropdown | CBSE / ICSE / State / IB / Other                                                                 |
| Student Count             | Number   | —                                                                                                |
| Contact Person            | Text     | Name + Title                                                                                     |
| Phone                     | Text     | —                                                                                                |
| Email                     | Text     | —                                                                                                |
| Source                    | Dropdown | Google Ads / Referral / Direct Visit / WhatsApp / Social / Conference / Inbound                  |
| Stage                     | Dropdown | Cold Lead → Contacted → Demo Scheduled → Demo Done → Trial → Proposal → Negotiation → Won → Lost |
| Assigned To               | Text     | Sales representative                                                                             |
| Next Action               | Text     | —                                                                                                |
| Next Action Date          | Date     | —                                                                                                |
| Plan Interest             | Dropdown | Starter / Growth / Pro / Enterprise                                                              |
| Expected Revenue (Annual) | Currency | —                                                                                                |
| Notes                     | Text     | —                                                                                                |
| Created Date              | Date     | —                                                                                                |
| Last Updated              | Date     | —                                                                                                |

### 8.3 Onboarding Tracker Columns

| Column                 | Type     | Values                                                    |
| ---------------------- | -------- | --------------------------------------------------------- |
| Client ID              | Auto     | C-001, C-002...                                           |
| School Name            | Text     | —                                                         |
| Plan                   | Dropdown | Starter / Growth / Pro / Enterprise                       |
| Contract Start         | Date     | —                                                         |
| Onboarding Stage       | Dropdown | Setup → Data Migration → Training → Pilot → Live → Review |
| Data Upload Status     | Dropdown | Pending / In Progress / Completed                         |
| Admin Training         | Dropdown | Scheduled / Completed                                     |
| Teacher Training       | Dropdown | Scheduled / Completed                                     |
| Pilot Start Date       | Date     | —                                                         |
| Go-Live Date           | Date     | —                                                         |
| First Review Date      | Date     | —                                                         |
| Health Score           | Dropdown | 🟢 Healthy / 🟡 At Risk / 🔴 Critical                     |
| Support Tickets (Open) | Number   | —                                                         |
| Usage (Sessions/Week)  | Number   | —                                                         |
| NPS Score              | Number   | 0-10                                                      |
| Renewal Date           | Date     | —                                                         |

---

## 9. ROADMAP & TIMELINE

### Phase 1: Critical Fixes (Weeks 1-2)

**Goal:** Eliminate all production blockers

| Week | Task                                                | Effort | Owner  |
| ---- | --------------------------------------------------- | ------ | ------ |
| W1   | Migrate students/[id] routes to MongoDB             | 4h     | Dev    |
| W1   | Delete debug endpoint, fix NEXTAUTH_SECRET          | 1h     | Dev    |
| W1   | Add rate limiting middleware                        | 4h     | Dev    |
| W1   | Apply Zod validation to all API routes              | 8h     | Dev    |
| W1   | Add security headers (CSP, HSTS) via middleware.ts  | 3h     | Dev    |
| W2   | Implement requireAuth/requireRole across all routes | 4h     | Dev    |
| W2   | Add health check endpoint                           | 1h     | Dev    |
| W2   | Enforce password complexity (8+ chars)              | 2h     | Dev    |
| W2   | Remove all Google Sheets legacy code                | 2h     | Dev    |
| W2   | Set up MongoDB Atlas backups (scheduled)            | 2h     | DevOps |

**Deliverable:** Security-hardened, bug-free application

### Phase 2: Production Infrastructure (Weeks 3-4)

**Goal:** Production-grade deployment with monitoring

| Week | Task                                       | Effort | Owner  |
| ---- | ------------------------------------------ | ------ | ------ |
| W3   | Set up Vercel production deployment        | 4h     | DevOps |
| W3   | Configure custom domain + SSL              | 2h     | DevOps |
| W3   | Set up Sentry error monitoring             | 2h     | Dev    |
| W3   | Add structured logging (Pino)              | 4h     | Dev    |
| W3   | Implement pagination on all list endpoints | 6h     | Dev    |
| W4   | Set up GitHub Actions CI/CD pipeline       | 4h     | DevOps |
| W4   | Implement student bulk import (CSV/Excel)  | 8h     | Dev    |
| W4   | Add CSV data export for all entities       | 6h     | Dev    |
| W4   | Write critical-path integration tests      | 8h     | Dev    |
| W4   | Finalize pricing page & marketing site     | 8h     | Design |

**Deliverable:** Deployed, monitored, CI/CD-enabled production app

### Phase 3: Pilot Launch (Weeks 5-6)

**Goal:** Onboard 3-5 pilot schools

| Week | Task                                          | Effort | Owner         |
| ---- | --------------------------------------------- | ------ | ------------- |
| W5   | Recruit 5 pilot schools (free 3-month trial)  | —      | Sales         |
| W5   | Create onboarding materials (videos, docs)    | 8h     | Marketing     |
| W5   | Conduct admin + teacher training sessions     | —      | Support       |
| W6   | Support pilot schools through first full week | —      | Support       |
| W6   | Collect feedback, fix critical bugs           | —      | Dev + Support |
| W6   | Create case studies from pilot schools        | 4h     | Marketing     |

**Deliverable:** 3-5 active schools, first case studies, validated product-market fit

### Phase 4: Market Launch (Weeks 7-10)

**Goal:** Public launch with marketing campaigns

| Week | Task                                               | Effort | Owner             |
| ---- | -------------------------------------------------- | ------ | ----------------- |
| W7   | Launch marketing website (features, pricing, demo) | —      | Marketing         |
| W7   | Start Google Ads + Social media campaigns          | —      | Marketing         |
| W7   | Launch referral program                            | —      | Marketing         |
| W8   | Host first public webinar                          | —      | Marketing + Sales |
| W8   | Begin school visit campaigns (local)               | —      | Sales             |
| W9   | Implement account lockout + audit logging          | 8h     | Dev               |
| W9   | Build PDF report export                            | 6h     | Dev               |
| W10  | First month revenue review                         | —      | All               |

**Deliverable:** Public product, paying customers, marketing machine running

### Phase 5: Scale (Weeks 11-24)

**Goal:** Scale to 50+ schools, start Phase 2 features

| Priority | Feature                                | Effort  | Impact                        |
| -------- | -------------------------------------- | ------- | ----------------------------- |
| P1       | Parent notification portal (read-only) | 2 weeks | High — huge differentiator    |
| P2       | SMS integration (Twilio/MSG91)         | 1 week  | High — parents in rural areas |
| P3       | Replace SSE with WebSocket/Redis       | 1 week  | Medium — scalability          |
| P4       | Multi-language support (Hindi, Telugu) | 2 weeks | High — Tier 2/3 cities        |
| P5       | Fee management module                  | 3 weeks | High — upsell opportunity     |
| P6       | Mobile app (React Native / Flutter)    | 6 weeks | Medium — convenience          |
| P7       | API for third-party integrations       | 2 weeks | Medium — enterprise           |
| P8       | WhatsApp bot for attendance alerts     | 1 week  | High — India-specific         |

### Visual Timeline

```
Week:  1   2   3   4   5   6   7   8   9  10  11  12 ... 24
       ├───┤   │   │   │   │   │   │   │   │   │   │      │
       │ P1: CRITICAL FIXES ────────►│   │   │   │   │      │
       │       ├───┤   │   │   │   │   │   │   │   │      │
       │       │ P2: PROD INFRA ─────►│   │   │   │   │      │
       │       │       ├───┤   │   │   │   │   │   │      │
       │       │       │ P3: PILOT LAUNCH ──►│   │   │      │
       │       │       │       ├───┤   │   │   │   │      │
       │       │       │       │ P4: MARKET LAUNCH ──►│      │
       │       │       │       │       ├───┤   │   │      │
       │       │       │       │       │ P5: SCALE ────────►│
       ▼       ▼       ▼       ▼       ▼                    ▼
    Bug-free  Deploy  5 pilots  Launch  50+ schools
```

---

## 10. APPENDIX: TEMPLATES

### 10.1 Outreach Email Template — Cold Outreach to Principals

```
Subject: Save 2 hours daily on attendance — [School Name]

Dear [Principal Name],

I noticed [School Name] has [X] students across multiple sections.
I wanted to ask: how much time do your teachers spend on attendance
every day?

Most schools we speak to say 15-20 minutes per class — that's
2+ hours of teaching time lost every day.

EduTrack lets teachers mark attendance in under 2 minutes using
QR codes or a simple checklist. Parents get instant notifications
if their child is absent or late. You get a real-time dashboard
showing school-wide attendance.

We're offering a free 30-day trial — no credit card, no commitment.

Would you be open to a quick 15-minute demo this week?

Best regards,
[Your Name]
EduTrack — Attendance Made Intelligent
[Phone] | [Email]
```

### 10.2 Outreach Email Template — Follow-up After Demo

```
Subject: Your EduTrack trial is ready — [School Name]

Dear [Principal Name],

Thank you for taking the time to see EduTrack in action today.
As discussed, here's what's set up for your 30-day free trial:

✅ Admin account: [admin-email]
✅ Login: edutrack.app/login
✅ Plan: Growth (up to 500 students) — FREE for 30 days

Next steps:
1. Upload your student list (CSV) — I've attached a template
2. Create teacher accounts (takes 2 minutes each)
3. Start marking attendance tomorrow!

I'll check in with you on [Day + 3] to see how things are going
and schedule a training session for your teachers.

If you need anything before then, reply to this email or
WhatsApp me at [number].

Best regards,
[Your Name]
```

### 10.3 Onboarding Checklist Template

```
╔════════════════════════════════════════════════════════════╗
║           EDUTRACK ONBOARDING CHECKLIST                    ║
║  School: _________________ Date: ________________        ║
╠════════════════════════════════════════════════════════════╣
║                                                           ║
║  PHASE 1: SETUP (Day 0-1)                                 ║
║  [ ] School registered on EduTrack                        ║
║  [ ] Admin email verified                                 ║
║  [ ] Admin logged in successfully                         ║
║  [ ] School name & details configured                     ║
║  [ ] Onboarding specialist assigned: _______________      ║
║                                                           ║
║  PHASE 2: DATA MIGRATION (Day 1-3)                        ║
║  [ ] Student master data uploaded (CSV)                   ║
║  [ ] Total students imported: _______                     ║
║  [ ] Classes & sections verified                          ║
║  [ ] Teacher accounts created: _______ teachers           ║
║  [ ] All teachers logged in & verified                    ║
║  [ ] Holiday calendar uploaded                            ║
║  [ ] Rooms configured (if applicable)                     ║
║  [ ] Timetable configured (if applicable)                 ║
║                                                           ║
║  PHASE 3: TRAINING (Day 3-5)                              ║
║  [ ] Admin training completed (Date: ______)              ║
║  [ ] Teacher training completed (Date: ______)            ║
║  [ ] QR attendance demonstrated                           ║
║  [ ] Training recordings shared                           ║
║  [ ] Quick reference guides distributed                   ║
║                                                           ║
║  PHASE 4: PILOT (Day 5-7)                                 ║
║  [ ] Parallel run started (paper + EduTrack)              ║
║  [ ] Day 1 check-in call ✓                                ║
║  [ ] Day 3 check-in call ✓                                ║
║  [ ] Day 5 review call ✓                                  ║
║  [ ] Issues identified & resolved                         ║
║                                                           ║
║  PHASE 5: GO LIVE (Day 7-14)                              ║
║  [ ] Paper attendance discontinued                        ║
║  [ ] Parent notifications activated                       ║
║  [ ] First weekly report generated                        ║
║  [ ] Feedback survey sent to teachers                     ║
║                                                           ║
║  PHASE 6: FIRST REVIEW (Day 30)                           ║
║  [ ] Monthly attendance report reviewed with principal    ║
║  [ ] Usage metrics reviewed                               ║
║  [ ] Feedback collected                                   ║
║  [ ] Trial → Paid conversion (if applicable)              ║
║  [ ] Referral program offered                             ║
║  [ ] NPS score: _______                                   ║
║                                                           ║
║  Sign-off: ____________________  Date: ________          ║
╚════════════════════════════════════════════════════════════╝
```

### 10.4 Service Agreement — Key Clauses

```
EDUTRACK SERVICE AGREEMENT (SUMMARY)
─────────────────────────────────────

1. PARTIES
   Provider: EduTrack (operated by [Your Company Name])
   Client: [School Name], represented by [Authorized Signatory]

2. SERVICES
   Cloud-based attendance management system as described at
   edutrack.app/features. Includes: software access, email
   support, data hosting, automated backups, system updates.

3. SUBSCRIPTION TERM
   Plan: [Starter/Growth/Pro/Enterprise]
   Term: [Monthly/Annual] starting [Date]
   Auto-renewal: Yes, with 30-day cancellation notice

4. PRICING
   Monthly fee: ₹[Amount]
   Payment due: Advance, within 7 days of invoice
   Late payment: 1.5% per month interest

5. DATA OWNERSHIP
   All student, teacher, and attendance data belongs to the
   school. EduTrack is a data processor, not data owner.

6. DATA PROTECTION
   - Data encrypted in transit (TLS 1.2+)
   - Daily automated backups (30-day retention)
   - Data stored in [Region] data centers
   - Compliant with India's DPDP Act 2023
   - School can request full data export at any time
   - Data deleted within 30 days of contract termination

7. UPTIME SLA
   99.5% monthly uptime guarantee, excluding scheduled
   maintenance (communicated 48 hours in advance)

8. SUPPORT
   Email: support@edutrack.app (Mon-Sat, 9 AM - 6 PM IST)
   WhatsApp: [Number] (Pro & Enterprise plans)
   Critical issues: 2-hour response time

9. TERMINATION
   Either party may terminate with 30 days written notice.
   Upon termination: data export provided within 7 days,
   data deleted within 30 days.

10. LIABILITY
    Maximum liability limited to fees paid in preceding
    12 months. No liability for indirect/consequential damages.
```

### 10.5 Revenue Projection (First 12 Months)

```
Month  | New Schools | Total Active | Plan Mix (Avg) | MRR      | Cumulative
───────┼────────────┼─────────────┼────────────────┼──────────┼──────────
  M1   |     3      |      3      |    ₹4,999      |  ₹14,997 |   ₹14,997
  M2   |     5      |      8      |    ₹4,999      |  ₹39,992 |   ₹54,989
  M3   |     7      |     14      |    ₹5,499      |  ₹76,986 |  ₹1,31,975
  M4   |    10      |     23      |    ₹5,499      | ₹1,26,477| ₹2,58,452
  M5   |    12      |     34      |    ₹5,499      | ₹1,86,966| ₹4,45,418
  M6   |    15      |     47      |    ₹5,999      | ₹2,81,953| ₹7,27,371
  M7   |    15      |     60      |    ₹5,999      | ₹3,59,940|₹10,87,311
  M8   |    18      |     76      |    ₹5,999      | ₹4,55,924|₹15,43,235
  M9   |    20      |     93      |    ₹5,999      | ₹5,57,907|₹21,01,142
  M10  |    22      |    112      |    ₹5,999      | ₹6,71,888|₹27,73,030
  M11  |    25      |    133      |    ₹5,999      | ₹7,97,867|₹35,70,897
  M12  |    25      |    154      |    ₹5,999      | ₹9,23,846|₹44,94,743
───────┴────────────┴─────────────┴────────────────┴──────────┴──────────
                    ARR by Month 12: ₹1,10,86,152 (~₹1.1 Cr)
                    Assumptions: 3% monthly churn, avg plan ₹5,499-₹5,999
```

---

## FINAL SUMMARY: ACTION ITEMS RANKED BY PRIORITY

| #   | Action                                      | Timeline | Effort | Impact        |
| --- | ------------------------------------------- | -------- | ------ | ------------- |
| 1   | Fix students/[id] Google Sheets bug         | Day 1    | 4h     | 🔴 Blocker    |
| 2   | Delete debug endpoint + fix NEXTAUTH_SECRET | Day 1    | 1h     | 🔴 Security   |
| 3   | Add rate limiting to auth endpoints         | Day 2    | 4h     | 🔴 Security   |
| 4   | Apply Zod validators to all routes          | Day 3-4  | 8h     | 🔴 Security   |
| 5   | Add security headers (middleware.ts)        | Day 4    | 3h     | 🔴 Security   |
| 6   | Use requireAuth/requireRole consistently    | Day 5    | 4h     | 🟡 Quality    |
| 7   | Remove Google Sheets legacy code            | Day 5    | 2h     | 🟡 Cleanup    |
| 8   | Deploy to Vercel + custom domain            | Week 3   | 6h     | 🔴 Launch     |
| 9   | Set up Sentry + structured logging          | Week 3   | 6h     | 🔴 Ops        |
| 10  | Build student bulk import                   | Week 4   | 8h     | 🟡 Onboarding |
| 11  | Recruit 3-5 pilot schools                   | Week 5   | —      | 🔴 Revenue    |
| 12  | Launch marketing website + ads              | Week 7   | —      | 🔴 Growth     |
| 13  | Build parent notification portal            | Week 11  | —      | 🟡 Feature    |
| 14  | Add SMS integration                         | Week 12  | —      | 🟡 Feature    |
| 15  | Build mobile app                            | Week 16+ | —      | 🟢 Scale      |

---

_This report was generated by analyzing the complete EduTrack codebase (15 Mongoose models, 17 API routes, 14 dashboard pages, auth system, email system) and cross-referencing with global education technology market data._

_Report v1.0 — February 6, 2026_
