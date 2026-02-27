import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFollow extends Document {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    followerId: { type: String, required: true, index: true },
    followingId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

// 복합 인덱스: 중복 팔로우 방지
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export default (mongoose.models.Follow as Model<IFollow>) ||
  mongoose.model<IFollow>('Follow', FollowSchema);
