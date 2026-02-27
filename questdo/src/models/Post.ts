import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPost extends Document {
  userId: string;
  userNickname: string;
  userAvatar: string;
  userLevel: number;
  userTitle: string;
  type: string;
  content: {
    text: string;
    imageUrl: string | null;
    taskRef: { title: string; category: string } | null;
    badgeRef: { id: string; name: string; icon: string } | null;
    milestoneType: string | null;
  };
  reactions: {
    likes: string[];
    cheers: string[];
    fires: string[];
  };
  totalReactions: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: String, required: true, index: true },
    userNickname: { type: String, required: true },
    userAvatar: { type: String, default: '' },
    userLevel: { type: Number, default: 1 },
    userTitle: { type: String, default: '' },
    type: { type: String, default: 'general' },
    content: {
      text: { type: String, default: '' },
      imageUrl: { type: String, default: null },
      taskRef: { type: Schema.Types.Mixed, default: null },
      badgeRef: { type: Schema.Types.Mixed, default: null },
      milestoneType: { type: String, default: null },
    },
    reactions: {
      likes: { type: [String], default: [] },
      cheers: { type: [String], default: [] },
      fires: { type: [String], default: [] },
    },
    totalReactions: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

PostSchema.index({ createdAt: -1 });
PostSchema.index({ userId: 1, createdAt: -1 });

export default (mongoose.models.Post as Model<IPost>) ||
  mongoose.model<IPost>('Post', PostSchema);
