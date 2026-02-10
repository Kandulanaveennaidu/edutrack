import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "admin" | "teacher" | "student" | "parent";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  school: mongoose.Types.ObjectId;
  phone: string;
  emailVerified: boolean;
  isActive: boolean;
  avatar: string;
  // Teacher-specific
  subject: string;
  classes: string[];
  salaryPerDay: number;
  joiningDate: Date;
  // Student-specific
  className: string;
  rollNumber: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  admissionDate: Date;
  // Parent-specific
  children: mongoose.Types.ObjectId[];
  // Module access (admin-assigned; empty = all plan modules)
  allowedModules: string[];
  // Custom role reference (optional — overrides default role permissions)
  customRole: mongoose.Types.ObjectId | null;
  // Security — Account lockout
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "teacher", "student", "parent"],
      required: true,
    },
    school: { type: Schema.Types.ObjectId, ref: "School" },
    phone: { type: String, default: "" },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    avatar: { type: String, default: "" },
    // Teacher fields
    subject: { type: String, default: "" },
    classes: [{ type: String }],
    salaryPerDay: { type: Number, default: 0 },
    joiningDate: { type: Date },
    // Student fields
    className: { type: String, default: "" },
    rollNumber: { type: String, default: "" },
    parentName: { type: String, default: "" },
    parentPhone: { type: String, default: "" },
    parentEmail: { type: String, default: "" },
    address: { type: String, default: "" },
    admissionDate: { type: Date },
    // Parent fields
    children: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    // Module access (admin-assigned; empty = all plan modules)
    allowedModules: [{ type: String }],
    // Custom role reference
    customRole: { type: Schema.Types.ObjectId, ref: "Role", default: null },
    // Security — Account lockout
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ school: 1, role: 1 });
UserSchema.index({ school: 1, email: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
