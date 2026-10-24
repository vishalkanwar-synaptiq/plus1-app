"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import s from "./ui.module.css";

/** Renders the opaque pass token as a QR code. The token carries no personal data. */
export function QrCode({ token }: { token: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    QRCode.toString(token, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#111827", light: "#ffffff" } }).then((out) => {
      if (live) setSvg(out);
    });
    return () => {
      live = false;
    };
  }, [token]);

  return (
    <div className={s.qrTile} role="img" aria-label="Admission QR code">
      {svg ? <span dangerouslySetInnerHTML={{ __html: svg }} /> : <span style={{ display: "block", width: 200, height: 200 }} />}
    </div>
  );
}
