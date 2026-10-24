import { getEvent, DOOR_EVENT_SLUG } from "@/lib/sample-data";
import { admissionWindow } from "@/lib/format";
import { ScanPass } from "./ScanPass";

export default function StaffScanPage() {
  const event = getEvent(DOOR_EVENT_SLUG)!;
  return <ScanPass eventName={event.name} detail={`Tonight · ${event.venue} · Entry ${admissionWindow(event)}`} />;
}
