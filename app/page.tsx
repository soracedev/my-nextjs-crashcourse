import { events } from "@/lib/constants";
import EventCard from "./components/EventCard";
import ExploreBtn from "./components/ExploreBtn";

interface PageProps {}

const Page: React.FC<PageProps> = () => {
  return (
    <section>
      <h1 className="text-center">
        The hub for every Dev Event. <br />
        You Mustn't Miss It!
      </h1>
      <p className="text-center mt-5">Hackatons, Meetups, Conferences</p>
      <ExploreBtn />
      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>
        <ul className="events">
          {events.map((event) => (
            <EventCard
              key={event.title}
              title={event.title}
              image={event.image}
              location={event.location}
              date={event.date}
              time={event.time}
              slug={event.slug}
            />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Page;
