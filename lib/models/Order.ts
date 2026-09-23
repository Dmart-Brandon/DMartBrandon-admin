import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, default: '' },
    productName: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    unit: { type: String, default: 'piece' },
    image: { type: String, default: '' },
    hsnCode: { type: String, default: '' },
  },
  {
    toJSON: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: (_: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
      default: 'pending',
    },
    trackingUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    items: [OrderItemSchema],
    shippingAddress: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    businessName: { type: String, default: '' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    deletedAt: { type: Date, default: null },
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

export const Order =
  mongoose.models.Order || mongoose.model('Order', OrderSchema);
