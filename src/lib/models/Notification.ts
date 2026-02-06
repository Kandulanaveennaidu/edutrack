import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  school: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  target_role: string;
  status: "unread" | "read";
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    school: { type: Schema.Types.ObjectId, ref: "School", required: true },
    type: { type: String, default: "announcement" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    target_role: { type: String, default: "all" },
    status: { type: String, enum: ["unread", "read"], default: "unread" },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

NotificationSchema.index({ school: 1, createdAt: -1 });
NotificationSchema.index({ school: 1, status: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
