import mongoose, { Schema, Document } from "mongoose";

export interface IWeeklySummary extends Document {
  athleteId: mongoose.Types.ObjectId;
  stravaAthleteId: number;
  weekStart: Date; // Monday of the week
  weekEnd: Date; // Sunday of the week
  totalDistance: number; // meters
  totalDuration: number; // seconds
  totalElevation: number; // meters
  totalActivities: number;
  avgSufferScore: number | null;
  totalSufferScore: number | null;
  activityTypes: Record<string, number>; // count per type
  calculatedAt: Date;
}

const WeeklySummarySchema = new Schema<IWeeklySummary>(
  {
    athleteId: { type: Schema.Types.ObjectId, ref: "Athlete", required: true },
    stravaAthleteId: { type: Number, required: true, index: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    totalDistance: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    totalElevation: { type: Number, default: 0 },
    totalActivities: { type: Number, default: 0 },
    avgSufferScore: { type: Number, default: null },
    totalSufferScore: { type: Number, default: null },
    activityTypes: { type: Map, of: Number, default: {} },
    calculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Ensure one summary per athlete per week
WeeklySummarySchema.index(
  { stravaAthleteId: 1, weekStart: 1 },
  { unique: true },
);

export const WeeklySummary = mongoose.model<IWeeklySummary>(
  "WeeklySummary",
  WeeklySummarySchema,
);
