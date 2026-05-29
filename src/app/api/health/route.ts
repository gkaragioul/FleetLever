import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDbPool().query("select 1");

    return NextResponse.json({
      ok: true,
      service: "fleetlever",
      database: "reachable",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: "fleetlever",
        database: "unreachable",
      },
      { status: 503 },
    );
  }
}
