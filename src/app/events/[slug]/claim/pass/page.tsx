import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ScreenFallback } from "@/components/ScreenFallback";
import { EVENTS, getEvent } from "@/lib/sample-data";
import { ClaimedPass } from "./ClaimedPass";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export default function ClaimedPassPage({ params }: PageProps<"/events/[slug]/claim/pass">) {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <Pass params={params} />
    </Suspense>
  );
}

async function Pass({ params }: { params: PageProps<"/events/[slug]/claim/pass">["params"] }) {
  const event = getEvent((await params).slug);
  if (!event) notFound();
  return <ClaimedPass event={event} />;
}
