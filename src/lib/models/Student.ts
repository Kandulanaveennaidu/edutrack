import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudent extends Document {
  school: mongoose.Types.ObjectId;
  class_name: string;
  roll_number: string;
  name: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  email: string;
  address: string;
  admission_date: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    school: { type: Schema.Types.ObjectId, ref: "School", required: true },
    class_name: { type: String, required: true },
    roll_number: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    parent_name: { type: String, default: "" },
    parent_phone: { type: String, default: "" },
    parent_email: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    admission_date: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

StudentSchema.index({ school: 1, class_name: 1, status: 1 });
StudentSchema.index({ school: 1, roll_number: 1, class_name: 1 });

const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);

export default Student;
