import { Suspense } from "react";
import { ScreenFallback } from "@/components/ScreenFallback";
import { admissionWindow, time } from "@/lib/format";
import { maskPhone } from "@/lib/phone";
import { DOOR_EVENT_SLUG, PASSES, findPass, getEvent } from "@/lib/sample-data";
import { DoorCheck, type StaffPassView } from "./DoorCheck";

export function generateStaticParams() {
  return PASSES.map((p) => ({ ref: p.ref }));
}

export default function StaffPassPage({ params }: PageProps<"/staff/passes/[ref]">) {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <StaffPass params={params} />
    </Suspense>
  );
}

async function StaffPass({ params }: { params: PageProps<"/staff/passes/[ref]">["params"] }) {
  const ref = decodeURIComponent((await params).ref);
  const pass = findPass(ref);
  const door = getEvent(DOOR_EVENT_SLUG)!;

  // Staff only get what they need at the door: masked phone, no token, birth date or ID data.
  let view: StaffPassView;
  if (!pass) view = { result: "not_found", ref };
  else if (pass.eventSlug !== door.slug) view = { result: "wrong_event", ref: pass.ref, name: pass.name, eventName: getEvent(pass.eventSlug)?.name ?? "another event" };
  else if (pass.status !== "confirmed") view = { result: "canceled", ref: pass.ref, name: pass.name };
  else if (pass.checkedIn) view = { result: "already_checked_in", ref: pass.ref, name: pass.name, at: time(pass.checkedIn.at, door.timeZone), by: pass.checkedIn.by };
  else view = { result: "valid", ref: pass.ref, name: pass.name, maskedPhone: maskPhone(pass.phone), windowEnd: time(door.admissionEnd, door.timeZone), window: admissionWindow(door) };

  return <DoorCheck view={view} />;
}
