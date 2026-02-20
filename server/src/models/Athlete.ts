import mongoose, { Schema, Document } from "mongoose";

export interface IAthlete extends Document {
  stravaId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  profile: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
    city?: string;
    country?: string;
  };
  hrZones?: {
    customZones: boolean;
    zones: Array<{ min: number; max: number }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AthleteSchema = new Schema<IAthlete>(
  {
    stravaId: { type: Number, required: true, unique: true, index: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Number, required: true },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      profilePicture: String,
      city: String,
      country: String,
    },
    hrZones: {
      customZones: Boolean,
      zones: [{ min: Number, max: Number }],
    },
  },
  { timestamps: true },
);

export const Athlete = mongoose.model<IAthlete>("Athlete", AthleteSchema);
