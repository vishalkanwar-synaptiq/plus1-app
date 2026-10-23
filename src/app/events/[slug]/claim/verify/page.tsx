import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ScreenFallback } from "@/components/ScreenFallback";
import { EVENTS, getEvent } from "@/lib/sample-data";
import { VerifyPhone } from "./VerifyPhone";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export default function VerifyPhonePage({ params }: PageProps<"/events/[slug]/claim/verify">) {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <Verify params={params} />
    </Suspense>
  );
}

async function Verify({ params }: { params: PageProps<"/events/[slug]/claim/verify">["params"] }) {
  const event = getEvent((await params).slug);
  if (!event) notFound();
  return <VerifyPhone slug={event.slug} />;
}
