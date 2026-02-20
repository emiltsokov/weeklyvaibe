import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  stravaActivityId: number;
  athleteId: mongoose.Types.ObjectId;
  stravaAthleteId: number;
  name: string;
  type: string;
  sportType: string;
  distance: number; // meters
  movingTime: number; // seconds
  elapsedTime: number; // seconds
  totalElevationGain: number; // meters
  sufferScore: number | null;
  averageHeartrate: number | null;
  maxHeartrate: number | null;
  averageSpeed: number; // m/s
  maxSpeed: number; // m/s
  startDate: Date;
  startDateLocal: Date;
  timezone: string;
  hasHeartrate: boolean;
  calculatedTSS?: number;
  hrZoneDistribution?: number[]; // time in each zone (seconds)
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    stravaActivityId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    athleteId: {
      type: Schema.Types.ObjectId,
      ref: "Athlete",
      required: true,
      index: true,
    },
    stravaAthleteId: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    sportType: { type: String, required: true },
    distance: { type: Number, required: true },
    movingTime: { type: Number, required: true },
    elapsedTime: { type: Number, required: true },
    totalElevationGain: { type: Number, default: 0 },
    sufferScore: { type: Number, default: null },
    averageHeartrate: { type: Number, default: null },
    maxHeartrate: { type: Number, default: null },
    averageSpeed: { type: Number, default: 0 },
    maxSpeed: { type: Number, default: 0 },
    startDate: { type: Date, required: true, index: true },
    startDateLocal: { type: Date, required: true },
    timezone: { type: String },
    hasHeartrate: { type: Boolean, default: false },
    calculatedTSS: { type: Number },
    hrZoneDistribution: [{ type: Number }],
  },
  { timestamps: true },
);

// Compound index for efficient weekly queries
ActivitySchema.index({ stravaAthleteId: 1, startDate: -1 });

export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);
