import { NextResponse } from "next/server";
import metadata from "../../../../package.json";

export function GET() {
  return NextResponse.json({ status: "ok", version: metadata.version });
}
