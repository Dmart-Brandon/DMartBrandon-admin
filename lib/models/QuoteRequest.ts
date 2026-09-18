import mongoose from 'mongoose';

const QuoteItemSchema = new mongoose.Schema(
  {
    productId: { type: String, default: '' },
    productName: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    unit: { type: String, default: 'piece' },
  },
  { _id: false }
);

const QuoteRequestSchema = new mongoose.Schema(
  {
    userId: { type: String, default: '' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, default: '' },
    businessName: { type: String, default: '' },
    gstin: { type: String, default: '' },
    items: { type: [QuoteItemSchema], default: [] },
    cartTotal: { type: Number, default: 0 },
    expectedFrequency: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['new', 'responded', 'closed'],
      default: 'new',
    },
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

export const QuoteRequest =
  mongoose.models.QuoteRequest ||
  mongoose.model('QuoteRequest', QuoteRequestSchema);
