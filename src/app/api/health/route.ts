import { NextResponse } from "next/server";
import metadata from "../../../../package.json";

export function GET() {
  return NextResponse.json({
    status: "ok",
    version: metadata.version,
    commit: process.env.BUILD_SHA || "unknown",
    environment: process.env.APP_ENV || process.env.NODE_ENV || "unknown",
  });
}
