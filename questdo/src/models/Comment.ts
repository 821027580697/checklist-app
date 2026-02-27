import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment extends Document {
  postId: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userNickname: { type: String, required: true },
    userAvatar: { type: String, default: '' },
    text: { type: String, required: true, maxlength: 200 },
  },
  { timestamps: true },
);

export default (mongoose.models.Comment as Model<IComment>) ||
  mongoose.model<IComment>('Comment', CommentSchema);
