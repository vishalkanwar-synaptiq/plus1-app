import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ScreenFallback } from "@/components/ScreenFallback";
import { EVENTS, getEvent } from "@/lib/sample-data";
import { DetailsForm } from "./DetailsForm";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export default function ClaimDetailsPage({ params }: PageProps<"/events/[slug]/claim">) {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <ClaimDetails params={params} />
    </Suspense>
  );
}

async function ClaimDetails({ params }: { params: PageProps<"/events/[slug]/claim">["params"] }) {
  const event = getEvent((await params).slug);
  if (!event) notFound();
  return <DetailsForm event={event} />;
}
