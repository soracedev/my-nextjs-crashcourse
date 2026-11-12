"use client";

import Image from "next/image";
import posthog from "posthog-js";

export default function ExploreBtn() {
  return (
    <button
      type="button"
      id="explore-btn"
      className="mt-7 mx-auto"
      onClick={() => {
        if (
          process.env.NEXT_PUBLIC_POSTHOG_KEY &&
          process.env.NEXT_PUBLIC_POSTHOG_HOST
        ) {
          posthog.capture("events_explored");
        }

        console.log("Explore button clicked!");
      }}
    >
      <a href="/events" className="text-white">
        Explore Events
        <Image
          src="/icons/arrow-down.svg"
          alt="arrow-down"
          width={24}
          height={24}
        />
      </a>
    </button>
  );
}
