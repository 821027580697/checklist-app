import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHabit extends Document {
  userId: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  frequency: {
    type: string;
    daysOfWeek: number[];
    timesPerWeek: number;
  };
  reminderTime: string | null;
  streak: number;
  longestStreak: number;
  completedDates: string[];
  totalChecks: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'other' },
    icon: { type: String, default: '💧' },
    color: { type: String, default: '#007AFF' },
    frequency: {
      type: { type: String, default: 'daily' },
      daysOfWeek: { type: [Number], default: [] },
      timesPerWeek: { type: Number, default: 7 },
    },
    reminderTime: { type: String, default: null },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    completedDates: { type: [String], default: [] },
    totalChecks: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default (mongoose.models.Habit as Model<IHabit>) ||
  mongoose.model<IHabit>('Habit', HabitSchema);
