import { z } from "zod";

// ──── Password Complexity ────
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

// ──── Auth Validators ────
export const registerSchema = z.object({
  school_name: z.string().min(2, "School name must be at least 2 characters"),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email("Invalid email").optional().default(""),
  admin_email: z.string().email("Invalid admin email"),
  admin_password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  role: z
    .enum(["admin", "teacher", "student", "parent"])
    .optional()
    .default("teacher"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

// ──── Student Validators ────
export const studentSchema = z.object({
  class_name: z.string().min(1, "Class name is required"),
  roll_number: z.string().min(1, "Roll number is required"),
  name: z.string().min(1, "Name is required"),
  parent_name: z.string().optional().default(""),
  parent_phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  address: z.string().optional().default(""),
});

export const updateStudentSchema = studentSchema.partial();

// ──── Attendance Validators ────
export const attendanceRecordSchema = z.object({
  student_id: z.string().min(1),
  status: z.enum(["present", "absent", "late", "leave"]),
  notes: z.string().optional().default(""),
});

export const markAttendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  class_name: z.string().min(1, "Class name is required"),
  school_id: z.string().optional(),
  records: z
    .array(attendanceRecordSchema)
    .min(1, "At least one record is required"),
});

// ──── Teacher Validators ────
export const teacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: passwordSchema,
  phone: z.string().optional().default(""),
  subject: z.string().optional().default(""),
  classes: z.string().optional().default(""),
  salary_per_day: z.union([z.string(), z.number()]).optional().default(""),
});

export const updateTeacherSchema = z.object({
  teacher_id: z.string().min(1),
  name: z.string().optional(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  classes: z.string().optional(),
  salary_per_day: z.union([z.string(), z.number()]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// ──── Leave Validators ────
export const leaveRequestSchema = z.object({
  student_id: z.string().min(1),
  student_name: z.string().optional().default(""),
  class_name: z.string().optional().default(""),
  from_date: z.string().min(1, "From date is required"),
  to_date: z.string().min(1, "To date is required"),
  reason: z.string().min(1, "Reason is required"),
});

export const leaveActionSchema = z.object({
  leave_id: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
});

// ──── Notification Validators ────
export const notificationSchema = z.object({
  type: z.string().optional().default("announcement"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  target_role: z.string().optional().default("all"),
});

// ──── Visitor Validators ────
export const visitorSchema = z.object({
  visitor_name: z.string().min(1, "Visitor name is required"),
  visitor_phone: z.string().optional().default(""),
  visitor_email: z.string().optional().default(""),
  purpose: z.string().min(1, "Purpose is required"),
  host_name: z.string().optional().default(""),
  host_type: z.string().optional().default("staff"),
  student_id: z.string().optional().default(""),
  id_proof: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  pre_register: z.boolean().optional().default(false),
});

// ──── Room Validators ────
export const addRoomSchema = z.object({
  room_name: z.string().min(1, "Room name is required"),
  room_type: z.string().min(1, "Room type is required"),
  capacity: z.union([z.string(), z.number()]).optional().default(""),
  floor: z.string().optional().default(""),
  facilities: z.string().optional().default(""),
});

export const bookRoomSchema = z.object({
  room_name: z.string().min(1),
  date: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  purpose: z.string().optional().default(""),
  attendees: z.string().optional().default(""),
  equipment_needed: z.string().optional().default(""),
});

// ──── Holiday Validators ────
export const holidaySchema = z.object({
  date: z.string().min(1, "Date is required"),
  name: z.string().min(1, "Holiday name is required"),
  type: z.enum(["national", "regional", "school", "exam", "event"]),
  description: z.string().optional().default(""),
});

// ──── Timetable Validators ────
export const timetableSchema = z.object({
  class_name: z.string().min(1),
  day: z.string().min(1),
  period: z.union([z.string(), z.number()]),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  subject: z.string().min(1),
  teacher_id: z.string().optional().default(""),
  teacher_name: z.string().optional().default(""),
  room: z.string().optional().default(""),
});

// ──── Emergency Alert Validators ────
export const emergencyAlertSchema = z.object({
  type: z.string().min(1, "Type is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  severity: z.enum(["critical", "high", "medium", "low"]),
});

// ──── Settings Validators ────
export const settingsSchema = z.object({
  settings: z.record(z.string(), z.string()),
});

// ──── QR Attendance Validators ────
export const qrGenerateSchema = z.object({
  action: z.literal("generate"),
  class_name: z.string().min(1),
  duration_minutes: z.number().optional().default(30),
});

export const qrScanSchema = z.object({
  action: z.literal("scan"),
  token: z.string().min(1),
  student_id: z.string().min(1),
});

// ──── Profile / Password Change ────
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Re-export password schema for use elsewhere
export { passwordSchema };
