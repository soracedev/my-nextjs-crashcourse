import { Schema, model, models, type Model, type HydratedDocument } from "mongoose";

export const EVENT_MODES = ["online", "offline", "hybrid"] as const;
export type EventMode = (typeof EVENT_MODES)[number];

export interface IEvent {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // Normalized to YYYY-MM-DD
  time: string; // Normalized to 24h HH:mm
  mode: EventMode;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type EventDocument = HydratedDocument<IEvent>;

/** Required string field that rejects empty / whitespace-only values (trim runs before `required`). */
const requiredString = (field: string) => ({
  type: String,
  required: [true, `${field} is required`] as [true, string],
  trim: true,
});

/** Required array of strings: must contain at least one non-empty item. */
const requiredStringArray = (field: string) => ({
  type: [{ type: String, trim: true }],
  required: [true, `${field} is required`] as [true, string],
  validate: {
    validator: (items: string[]) => items.length > 0 && items.every((item) => item.length > 0),
    message: `${field} must contain at least one non-empty item`,
  },
});

const EventSchema = new Schema<IEvent>(
  {
    title: requiredString("Title"),
    // Unique index declared here; value is generated in the pre-save hook.
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: requiredString("Description"),
    overview: requiredString("Overview"),
    image: requiredString("Image"),
    venue: requiredString("Venue"),
    location: requiredString("Location"),
    date: requiredString("Date"),
    time: requiredString("Time"),
    mode: {
      ...requiredString("Mode"),
      lowercase: true,
      enum: { values: EVENT_MODES, message: "Mode must be one of: online, offline, hybrid" },
    },
    audience: requiredString("Audience"),
    agenda: requiredStringArray("Agenda"),
    organizer: requiredString("Organizer"),
    tags: requiredStringArray("Tags"),
  },
  { timestamps: true },
);

/** Converts a title to a URL-friendly slug, e.g. "Next.js Conf 2025!" -> "next-js-conf-2025". */
function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // Strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Collapse non-alphanumerics into single hyphens
    .replace(/^-+|-+$/g, "");
}

/** Normalizes any parseable date to ISO YYYY-MM-DD. */
function normalizeDate(value: string): string {
  // Already ISO: keep as-is to avoid timezone shifts from re-parsing.
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const parsed = isoMatch
    ? new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])))
    : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: "${value}"`);
  }

  // Use UTC getters for ISO input, local getters for free-form input (parsed in local time).
  const [y, m, d] = isoMatch
    ? [parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, parsed.getUTCDate()]
    : [parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()];

  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Normalizes "9:30 am", "9 PM", "14:05" etc. to 24h HH:mm. */
function normalizeTime(value: string): string {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?$/i.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid time: "${value}"`);
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const meridiem = match[3]?.toLowerCase().replace(/\./g, "");

  if (meridiem) {
    if (hours < 1 || hours > 12) throw new Error(`Invalid time: "${value}"`);
    if (meridiem === "pm" && hours !== 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
  }

  if (hours > 23 || minutes > 59) {
    throw new Error(`Invalid time: "${value}"`);
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

EventSchema.pre("save", function () {
  // Regenerate the slug only when the title changes, keeping existing URLs stable.
  if (this.isModified("title") || !this.slug) {
    const slug = slugify(this.title);
    if (!slug) {
      throw new Error("Title must contain at least one alphanumeric character");
    }
    this.slug = slug;
  }

  // Throwing aborts the save and surfaces the error to the caller.
  if (this.isModified("date")) {
    this.date = normalizeDate(this.date);
  }
  if (this.isModified("time")) {
    this.time = normalizeTime(this.time);
  }
});

// Reuse the compiled model across hot reloads to avoid OverwriteModelError.
const Event: Model<IEvent> = (models.Event as Model<IEvent> | undefined) ?? model<IEvent>("Event", EventSchema);

export default Event;
