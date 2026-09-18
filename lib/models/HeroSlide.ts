import mongoose from 'mongoose';

const HeroSlideSchema = new mongoose.Schema(
  {
    headline: { type: String, required: true },
    subText: { type: String, default: '' },
    ctaText: { type: String, default: 'Shop now' },
    ctaHref: { type: String, required: true },
    imageDesktop: { type: String, required: true },
    imageMobile: { type: String, default: '' },
    displayOrder: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ['active', 'draft'],
      default: 'draft',
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

export const HeroSlide =
  mongoose.models.HeroSlide || mongoose.model('HeroSlide', HeroSlideSchema);
