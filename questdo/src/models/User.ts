import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Omit<Document, '_id'> {
  _id: string; // Google uid 그대로 사용
  email: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  level: number;
  xp: number;
  totalXp: number;
  title: string;
  stats: {
    totalCompleted: number;
    currentStreak: number;
    longestStreak: number;
    totalHabitChecks: number;
    lastStreakDate: string;
  };
  badges: string[];
  settings: {
    theme: string;
    language: string;
    notifications: {
      taskReminder: boolean;
      habitReminder: boolean;
      socialActivity: boolean;
      achievements: boolean;
    };
    privacy: {
      profilePublic: boolean;
      showStreak: boolean;
      showLevel: boolean;
    };
  };
  followersCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true }, // Google uid
    email: { type: String, required: true },
    nickname: { type: String, required: true, index: true },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 150 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    totalXp: { type: Number, default: 0 },
    title: { type: String, default: '초보 모험가' },
    stats: {
      totalCompleted: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      totalHabitChecks: { type: Number, default: 0 },
      lastStreakDate: { type: String, default: '' },
    },
    badges: { type: [String], default: [] },
    settings: {
      theme: { type: String, default: 'system' },
      language: { type: String, default: 'ko' },
      notifications: {
        taskReminder: { type: Boolean, default: true },
        habitReminder: { type: Boolean, default: true },
        socialActivity: { type: Boolean, default: true },
        achievements: { type: Boolean, default: true },
      },
      privacy: {
        profilePublic: { type: Boolean, default: true },
        showStreak: { type: Boolean, default: true },
        showLevel: { type: Boolean, default: true },
      },
    },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);
