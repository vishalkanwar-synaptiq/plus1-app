"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import styles from "./PrototypeBar.module.css";

type Theme = "dark" | "light";

function subscribe(listener: () => void) {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const currentTheme = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

/** Labels every screen as a prototype and lets the viewer switch theme (dark is the default). */
export function PrototypeBar() {
  const theme = useSyncExternalStore(subscribe, currentTheme, (): Theme => "dark");

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("plus1.theme", next);
    } catch {
      // Theme still switches for this page view.
    }
  };

  return (
    <div className={styles.bar}>
      <p>
        <strong>Prototype</strong> · sample data, no real texts or ID checks
      </p>
      <nav className={styles.links} aria-label="Prototype areas">
        <Link href="/">Guest</Link>
        <Link href="/staff">Door</Link>
        <Link href="/venue">Venue</Link>
        <button type="button" onClick={toggle} aria-pressed={theme === "light"}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </nav>
    </div>
  );
}
