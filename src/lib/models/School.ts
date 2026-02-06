import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISchool extends Document {
  school_name: string;
  address: string;
  phone: string;
  email: string;
  plan: "free" | "basic" | "premium";
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    school_name: { type: String, required: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    plan: { type: String, enum: ["free", "basic", "premium"], default: "free" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

SchoolSchema.index({ email: 1 });

const School: Model<ISchool> =
  mongoose.models.School || mongoose.model<ISchool>("School", SchoolSchema);

export default School;
