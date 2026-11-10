import Image from "next/image";
import Link from "next/link";

export default function EventCard({
  title,
  image,
  location,
  date,
  slug,
  time,
}: {
  title: string;
  image: string;
  location: string;
  date: string;
  slug: string;
  time: string;
}) {
  return (
    <Link href={`/events/${slug}`} id="event-card">
      <Image
        src={image}
        alt={title}
        width={410}
        height={300}
        className="poster"
      />
      <div className="flex flex-row gap-2">
        <Image src="/icons/pin.svg" alt="location" width={14} height={14} />
        <p>{location}</p>
      </div>
      <p className="title">{title}</p>
      <div className="datetime">
        <Image src="/icons/calendar.svg" alt="date" width={14} height={14} />
        <p>{date}</p>
      </div>
      <div className="datetime">
        <Image src="/icons/clock.svg" alt="time" width={14} height={14} />
        <p>{time}</p>
      </div>
    </Link>
  );
}
