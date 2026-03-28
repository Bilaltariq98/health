"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { ActiveSession } from "./active-session";

export default function ActiveSessionPage() {
  return (
    <Suspense>
      <ActiveSessionInner />
    </Suspense>
  );
}

function ActiveSessionInner() {
  const params = useSearchParams();
  const router = useRouter();
  const day = params.get("day") as "tuesday" | "wednesday" | "friday" | null;

  if (!day) {
    router.replace("/workouts");
    return null;
  }

  return <ActiveSession day={day} />;
}
