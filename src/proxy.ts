import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple HTTP Basic Auth gate for the whole site. Any username, password "plneuro".
const PASSWORD = "plneuro";

export function proxy(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const pass = decoded.slice(decoded.indexOf(":") + 1);
      if (pass === PASSWORD) return NextResponse.next();
    } catch {
      // fall through to 401
    }
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Neuro Atlas", charset="UTF-8"' },
  });
}

export const config = {
  // Gate everything except Next's internal asset pipeline and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
