import mongoose, { Schema, Document } from "mongoose";

export type GoalType = "duration" | "distance";
export type ActivityFilter = "all" | "run" | "ride" | "swim";

export interface IGoal extends Document {
  athleteId: number;
  type: GoalType;
  target: number;
  unit: string; // 'hours', 'km', 'miles'
  activityFilter: ActivityFilter;
  weekStart: Date;
  progress: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    athleteId: { type: Number, required: true, index: true },
    type: {
      type: String,
      enum: ["duration", "distance"],
      required: true,
    },
    target: { type: Number, required: true },
    unit: { type: String, required: true },
    activityFilter: {
      type: String,
      enum: ["all", "run", "ride", "swim"],
      default: "all",
    },
    weekStart: { type: Date, required: true },
    progress: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Compound index for efficient queries
GoalSchema.index({ athleteId: 1, weekStart: 1, isActive: 1 });

export const Goal = mongoose.model<IGoal>("Goal", GoalSchema);
