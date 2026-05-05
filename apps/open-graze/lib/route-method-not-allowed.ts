import { NextResponse } from "next/server";

export function methodNotAllowed(...allowed: string[]) {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    {
      status: 405,
      headers: {
        Allow: allowed.join(", "),
      },
    },
  );
}
