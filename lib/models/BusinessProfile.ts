import mongoose from 'mongoose';

const GstinEntrySchema = new mongoose.Schema(
  {
    gstin: { type: String, required: true, uppercase: true, trim: true },
    label: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const BusinessProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    businessName: { type: String, default: '' },
    gstins: { type: [GstinEntrySchema], default: [] },
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

export const BusinessProfile =
  mongoose.models.BusinessProfile ||
  mongoose.model('BusinessProfile', BusinessProfileSchema);
