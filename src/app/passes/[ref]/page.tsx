import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PassView } from "@/components/PassView";
import { ScreenFallback } from "@/components/ScreenFallback";
import { PASSES, findPass, getEvent } from "@/lib/sample-data";

export function generateStaticParams() {
  return PASSES.map((p) => ({ ref: p.ref }));
}

export default function SavedPassPage({ params }: PageProps<"/passes/[ref]">) {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <SavedPass params={params} />
    </Suspense>
  );
}

async function SavedPass({ params }: { params: PageProps<"/passes/[ref]">["params"] }) {
  const pass = findPass((await params).ref);
  const event = pass && getEvent(pass.eventSlug);
  if (!pass || !event) notFound();
  return (
    <PassView
      event={event}
      name={pass.name}
      passRef={pass.ref}
      token={pass.token}
      status={pass.status}
      checkedInAt={pass.checkedIn?.at}
      backHref="/my-guest-list"
    />
  );
}
