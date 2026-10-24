import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ScreenFallback } from "@/components/ScreenFallback";
import { EVENTS, getEvent } from "@/lib/sample-data";
import { ScanId } from "./ScanId";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export default function ScanIdPage({ params }: PageProps<"/events/[slug]/claim/scan-id">) {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <Scan params={params} />
    </Suspense>
  );
}

async function Scan({ params }: { params: PageProps<"/events/[slug]/claim/scan-id">["params"] }) {
  const event = getEvent((await params).slug);
  if (!event) notFound();
  const eventDay = new Intl.DateTimeFormat("en-US", { timeZone: event.timeZone, month: "short", day: "numeric" }).format(new Date(event.startsAt));
  return <ScanId slug={event.slug} eventDay={eventDay} />;
}
