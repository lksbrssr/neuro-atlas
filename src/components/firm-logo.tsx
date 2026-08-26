"use client";

import Image from "next/image";
import { useState } from "react";

// Company logo chip. Local (mirrored) logos go through next/image; anything
// remote uses a plain <img>. Either way, a load error — not just a missing
// URL — falls back to the initial-letter chip.
//
// `unoptimized`: the site-wide basic-auth gate (src/proxy.ts) 401s the image
// optimizer's internal fetch of /logos/*, and the mirrored logos are already
// ≤200px — optimizing them buys nothing.
/* eslint-disable @next/next/no-img-element */
export function FirmLogo({
  src,
  name,
  size = 18,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    const common = {
      width: size,
      height: size,
      loading: "lazy" as const,
      className: "shrink-0 rounded-[5px] object-cover",
      style: { width: size, height: size },
      onError: () => setFailed(true),
    };
    return src.startsWith("/") ? <Image src={src} alt="" unoptimized {...common} /> : <img src={src} alt="" {...common} />;
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[5px] bg-accent-soft font-semibold text-accent"
      style={{ width: size, height: size, fontSize: Math.max(size * 0.5, 10) }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
