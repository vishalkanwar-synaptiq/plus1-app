import Link from "next/link";
import { Suspense } from "react";
import { Icon } from "@/components/Icon";
import { Content, Screen, ui } from "@/components/ui";
import { EventSearch } from "./EventSearch";

export default function DiscoverPage() {
  return (
    <Screen>
      <header className={ui.row} style={{ padding: "20px 24px 8px", justifyContent: "space-between" }}>
        <p className={ui.title}>plus1</p>
        <Link href="/my-guest-list" className={ui.pillLink}>
          <Icon name="ticket" size={18} />
          My guest list
        </Link>
      </header>
      <Content>
        <div className={ui.stack} style={{ gap: 6, paddingTop: 8 }}>
          <h1 className={ui.display}>Get on the list tonight</h1>
          <p className={`${ui.body} ${ui.muted}`}>Free guest-list spots from local venues. 21+ only.</p>
        </div>
        <Suspense fallback={<p className={`${ui.caption} ${ui.muted}`}>Loading events…</p>}>
          <EventSearch />
        </Suspense>
      </Content>
    </Screen>
  );
}
