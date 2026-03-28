"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { ActiveSession } from "./active-session";
import { PROGRAMME } from "@/lib/programme";

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
  const raw = params.get("session");
  const sessionIndex = raw !== null ? parseInt(raw) : NaN;

  if (isNaN(sessionIndex) || sessionIndex < 0 || sessionIndex >= PROGRAMME.length) {
    router.replace("/workouts");
    return null;
  }

  return <ActiveSession sessionIndex={sessionIndex} />;
}
