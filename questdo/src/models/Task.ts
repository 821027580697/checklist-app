import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  dueDate: Date | null;
  dueTime: string | null;
  reminder: {
    enabled: boolean;
    type: string;
  };
  isRecurring: boolean;
  recurringPattern: {
    frequency: string;
    daysOfWeek: number[];
    endDate: Date | null;
  } | null;
  subtasks: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
  }>;
  financeData?: {
    transactionType: string;
    amount: number;
    currency: string;
    expenseCategory?: string;
    convertedAmount?: number;
    convertedCurrency?: string;
    exchangeRate?: number;
    paymentMethod?: string;
    merchant?: string;
    memo?: string;
    receiptImageUrl?: string;
  };
  xpEarned: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SubtaskSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false },
);

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    category: { type: String, default: 'other' },
    priority: { type: String, default: 'medium' },
    status: { type: String, default: 'todo' },
    dueDate: { type: Date, default: null },
    dueTime: { type: String, default: null },
    reminder: {
      enabled: { type: Boolean, default: false },
      type: { type: String, default: 'at_time' },
    },
    isRecurring: { type: Boolean, default: false },
    recurringPattern: { type: Schema.Types.Mixed, default: null },
    subtasks: { type: [SubtaskSchema], default: [] },
    financeData: { type: Schema.Types.Mixed, default: undefined },
    xpEarned: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

TaskSchema.index({ userId: 1, status: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, category: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });

export default (mongoose.models.Task as Model<ITask>) ||
  mongoose.model<ITask>('Task', TaskSchema);
