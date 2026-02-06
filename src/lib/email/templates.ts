const APP_NAME = "EduTrack";
const PRIMARY_COLOR = "#2563eb";
const BG_COLOR = "#f8fafc";

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BG_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <div style="width: 56px; height: 56px; background-color: ${PRIMARY_COLOR}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                <span style="font-size: 24px; color: white;">🎓</span>
              </div>
              <h1 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>
        </table>
        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
        </table>
        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
          <tr>
            <td align="center">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. School & College Attendance Management System.
              </p>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(
  text: string,
  url: string,
  color: string = PRIMARY_COLOR,
): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px auto;">
  <tr>
    <td align="center" style="background-color: ${color}; border-radius: 8px;">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

// ──────────────────────────────────────────
// Template: Welcome Email
// ──────────────────────────────────────────
export function welcomeEmail(params: {
  name: string;
  schoolName: string;
  schoolId: string;
  email: string;
  role: string;
  loginUrl: string;
}): string {
  return baseLayout(`
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 22px;">Welcome to ${APP_NAME}! 🎉</h2>
    <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
      Hi <strong>${params.name}</strong>, your account has been successfully created.
    </p>
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0 0 8px; color: #0369a1; font-size: 14px; font-weight: 600;">Your Account Details:</p>
      <table cellspacing="0" cellpadding="4" style="color: #0c4a6e; font-size: 14px;">
        <tr><td style="font-weight: 600;">School:</td><td>${params.schoolName}</td></tr>
        <tr><td style="font-weight: 600;">School ID:</td><td><code style="background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${params.schoolId}</code></td></tr>
        <tr><td style="font-weight: 600;">Email:</td><td>${params.email}</td></tr>
        <tr><td style="font-weight: 600;">Role:</td><td style="text-transform: capitalize;">${params.role}</td></tr>
      </table>
    </div>
    ${buttonHtml("Go to Dashboard", params.loginUrl)}
    <p style="margin: 16px 0 0; color: #94a3b8; font-size: 13px; text-align: center;">
      Keep your School ID safe — you'll need to share it with your staff.
    </p>
  `);
}

// ──────────────────────────────────────────
// Template: Email Verification
// ──────────────────────────────────────────
export function verificationEmail(params: {
  name: string;
  verifyUrl: string;
  expiresIn: string;
}): string {
  return baseLayout(`
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 22px;">Verify Your Email ✉️</h2>
    <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
      Hi <strong>${params.name}</strong>, please verify your email address by clicking the button below.
    </p>
    ${buttonHtml("Verify Email Address", params.verifyUrl, "#16a34a")}
    <p style="margin: 16px 0 0; color: #94a3b8; font-size: 13px; text-align: center;">
      This link expires in <strong>${params.expiresIn}</strong>. If you didn't create an account, you can safely ignore this email.
    </p>
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${params.verifyUrl}" style="color: ${PRIMARY_COLOR}; word-break: break-all;">${params.verifyUrl}</a>
      </p>
    </div>
  `);
}

// ──────────────────────────────────────────
// Template: Password Reset
// ──────────────────────────────────────────
export function passwordResetEmail(params: {
  name: string;
  resetUrl: string;
  expiresIn: string;
}): string {
  return baseLayout(`
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 22px;">Reset Your Password 🔒</h2>
    <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
      Hi <strong>${params.name}</strong>, we received a request to reset your password.
    </p>
    ${buttonHtml("Reset Password", params.resetUrl, "#dc2626")}
    <p style="margin: 16px 0 0; color: #94a3b8; font-size: 13px; text-align: center;">
      This link expires in <strong>${params.expiresIn}</strong>.
    </p>
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 16px;">
      <p style="margin: 0; color: #991b1b; font-size: 13px;">
        ⚠️ If you didn't request a password reset, please ignore this email and ensure your account is secure.
      </p>
    </div>
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        If the button doesn't work, copy this link:<br/>
        <a href="${params.resetUrl}" style="color: ${PRIMARY_COLOR}; word-break: break-all;">${params.resetUrl}</a>
      </p>
    </div>
  `);
}

// ──────────────────────────────────────────
// Template: Late Arrival Alert
// ──────────────────────────────────────────
export function lateAlertEmail(params: {
  parentName: string;
  studentName: string;
  className: string;
  date: string;
  time: string;
}): string {
  return baseLayout(`
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 22px;">Late Arrival Notification ⏰</h2>
    <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
      Dear <strong>${params.parentName}</strong>,
    </p>
    <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
      This is to inform you that your child <strong>${params.studentName}</strong> arrived late to school today.
    </p>
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <table cellspacing="0" cellpadding="4" style="color: #92400e; font-size: 14px;">
        <tr><td style="font-weight: 600;">Student:</td><td>${params.studentName}</td></tr>
        <tr><td style="font-weight: 600;">Class:</td><td>${params.className}</td></tr>
        <tr><td style="font-weight: 600;">Date:</td><td>${params.date}</td></tr>
        <tr><td style="font-weight: 600;">Arrival Time:</td><td>${params.time}</td></tr>
      </table>
    </div>
    <p style="margin: 0; color: #475569; font-size: 14px;">
      Please ensure timely attendance to support your child's learning.
    </p>
  `);
}

// ──────────────────────────────────────────
// Template: Absent Alert
// ──────────────────────────────────────────
export function absentAlertEmail(params: {
  parentName: string;
  studentName: string;
  className: string;
  date: string;
}): string {
  return baseLayout(`
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 22px;">Absence Notification 📋</h2>
    <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
      Dear <strong>${params.parentName}</strong>,
    </p>
    <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
      Your child <strong>${params.studentName}</strong> was marked absent from school today.
    </p>
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <table cellspacing="0" cellpadding="4" style="color: #991b1b; font-size: 14px;">
        <tr><td style="font-weight: 600;">Student:</td><td>${params.studentName}</td></tr>
        <tr><td style="font-weight: 600;">Class:</td><td>${params.className}</td></tr>
        <tr><td style="font-weight: 600;">Date:</td><td>${params.date}</td></tr>
        <tr><td style="font-weight: 600;">Status:</td><td>Absent</td></tr>
      </table>
    </div>
    <p style="margin: 0; color: #475569; font-size: 14px;">
      If your child is unwell, please submit a leave application through the portal.
    </p>
  `);
}

// ──────────────────────────────────────────
// Template: Leave Status Update
// ──────────────────────────────────────────
export function leaveStatusEmail(params: {
  name: string;
  studentName: string;
  status: "approved" | "rejected";
  fromDate: string;
  toDate: string;
  approvedBy: string;
}): string {
  const isApproved = params.status === "approved";
  const statusColor = isApproved ? "#16a34a" : "#dc2626";
  const bgColor = isApproved ? "#f0fdf4" : "#fef2f2";
  const borderColor = isApproved ? "#bbf7d0" : "#fecaca";

  return baseLayout(`
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 22px;">Leave Request ${isApproved ? "Approved ✅" : "Rejected ❌"}</h2>
    <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
      Dear <strong>${params.name}</strong>,
    </p>
    <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
      The leave request for <strong>${params.studentName}</strong> has been
      <span style="color: ${statusColor}; font-weight: 600;">${params.status}</span>.
    </p>
    <div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px;">
      <table cellspacing="0" cellpadding="4" style="font-size: 14px;">
        <tr><td style="font-weight: 600;">Student:</td><td>${params.studentName}</td></tr>
        <tr><td style="font-weight: 600;">From:</td><td>${params.fromDate}</td></tr>
        <tr><td style="font-weight: 600;">To:</td><td>${params.toDate}</td></tr>
        <tr><td style="font-weight: 600;">Status:</td><td style="color: ${statusColor}; font-weight: 600; text-transform: capitalize;">${params.status}</td></tr>
        <tr><td style="font-weight: 600;">Processed by:</td><td>${params.approvedBy}</td></tr>
      </table>
    </div>
  `);
}

// ──────────────────────────────────────────
// Template: Emergency Broadcast
// ──────────────────────────────────────────
export function emergencyAlertEmail(params: {
  schoolName: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  sentBy: string;
  sentAt: string;
}): string {
  const severityColors: Record<
    string,
    { bg: string; border: string; text: string }
  > = {
    critical: { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" },
    high: { bg: "#fff7ed", border: "#fdba74", text: "#9a3412" },
    medium: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
    low: { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1" },
  };
  const colors = severityColors[params.severity] || severityColors.medium;

  return baseLayout(`
    <h2 style="margin: 0 0 16px; color: #dc2626; font-size: 22px;">🚨 Emergency Alert</h2>
    <div style="background-color: ${colors.bg}; border: 2px solid ${colors.border}; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
      <p style="margin: 0 0 4px; color: ${colors.text}; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
        ${params.severity} SEVERITY — ${params.type}
      </p>
      <h3 style="margin: 8px 0; color: ${colors.text}; font-size: 20px;">${params.title}</h3>
      <p style="margin: 0; color: ${colors.text}; font-size: 15px; line-height: 1.6;">${params.message}</p>
    </div>
    <div style="padding: 12px; background-color: #f1f5f9; border-radius: 8px;">
      <table cellspacing="0" cellpadding="4" style="font-size: 13px; color: #475569;">
        <tr><td style="font-weight: 600;">School:</td><td>${params.schoolName}</td></tr>
        <tr><td style="font-weight: 600;">Sent by:</td><td>${params.sentBy}</td></tr>
        <tr><td style="font-weight: 600;">Time:</td><td>${params.sentAt}</td></tr>
      </table>
    </div>
  `);
}

// ──────────────────────────────────────────
// Template: Visitor Notification
// ──────────────────────────────────────────
export function visitorNotificationEmail(params: {
  hostName: string;
  visitorName: string;
  purpose: string;
  checkInTime: string;
  badgeNumber: string;
}): string {
  return baseLayout(`
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 22px;">Visitor Arrival 🏫</h2>
    <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
      Hi <strong>${params.hostName}</strong>, a visitor has arrived to meet you.
    </p>
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
      <table cellspacing="0" cellpadding="4" style="color: #166534; font-size: 14px;">
        <tr><td style="font-weight: 600;">Visitor:</td><td>${params.visitorName}</td></tr>
        <tr><td style="font-weight: 600;">Purpose:</td><td>${params.purpose}</td></tr>
        <tr><td style="font-weight: 600;">Check-in:</td><td>${params.checkInTime}</td></tr>
        <tr><td style="font-weight: 600;">Badge #:</td><td><code style="background: #dcfce7; padding: 2px 6px; border-radius: 4px;">${params.badgeNumber}</code></td></tr>
      </table>
    </div>
  `);
}
