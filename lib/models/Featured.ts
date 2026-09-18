import mongoose from 'mongoose';

const FeaturedSchema = new mongoose.Schema(
  {
    slot: { type: String, required: true, unique: true, default: 'home' },
    productIds: { type: [String], default: [] },
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

export const Featured =
  mongoose.models.Featured || mongoose.model('Featured', FeaturedSchema);
