import mongoose from 'mongoose';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const PriceTierSchema = new mongoose.Schema(
  {
    minQty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PackSizeSchema = new mongoose.Schema(
  {
    qty: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true },
    label: { type: String, default: '' },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    categoryId: { type: String, default: '' },
    categoryName: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    unit: { type: String, default: 'piece' },
    moq: { type: Number, default: 1, min: 1 },
    stepSize: { type: Number, default: 1, min: 1 },
    packSize: { type: PackSizeSchema, default: undefined },
    priceTiers: { type: [PriceTierSchema], default: [] },
    grade: { type: String, default: '' },
    origin: { type: String, default: '' },
    shelfLifeDays: { type: Number },
    leadTimeHours: { type: Number },
    warrantyMonths: { type: Number },
    keySpec: { type: String, default: '' },
    brand: { type: String, default: '' },
    hsnCode: { type: String, default: '' },
    deliveryEtaHours: { type: Number, default: 24 },
    secondaryImage: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    images: { type: [String], default: [] },
    specs: { type: Map, of: String, default: {} },
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

ProductSchema.pre('validate', function (this: any) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name);
  }
});

export const Product =
  mongoose.models.Product || mongoose.model('Product', ProductSchema);
