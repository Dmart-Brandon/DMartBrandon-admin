import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, maxlength: 200 },
    displayOrder: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ['active', 'draft'],
      default: 'active',
    },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: (_: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Announcement =
  mongoose.models.Announcement ||
  mongoose.model('Announcement', AnnouncementSchema);
