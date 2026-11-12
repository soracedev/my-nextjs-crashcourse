import { Schema, model, models, type Model, type HydratedDocument, type Types } from "mongoose";
import Event from "./event.model";

export interface IBooking {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingDocument = HydratedDocument<IBooking>;

// Pragmatic email check: one "@", no whitespace, and a dotted domain.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true, // Bookings are almost always looked up by event.
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true, // Store canonical form so lookups are case-insensitive.
      validate: {
        validator: (value: string) => EMAIL_REGEX.test(value),
        message: "Please provide a valid email address",
      },
    },
  },
  { timestamps: true },
);

// Ensure the referenced event exists; only checked when eventId is set or changed.
BookingSchema.pre("save", async function () {
  if (!this.isModified("eventId")) return;

  const eventExists = await Event.exists({ _id: this.eventId });
  if (!eventExists) {
    throw new Error(`Event with ID ${this.eventId.toString()} does not exist`);
  }
});

// Reuse the compiled model across hot reloads to avoid OverwriteModelError.
const Booking: Model<IBooking> =
  (models.Booking as Model<IBooking> | undefined) ?? model<IBooking>("Booking", BookingSchema);

export default Booking;
