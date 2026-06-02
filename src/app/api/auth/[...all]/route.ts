import { NextResponse } from "next/server";

// Better-Auth removed — Ringr uses its own NestJS JWT auth backend.
export function GET() {
  return NextResponse.json({ error: "Not used" }, { status: 404 });
}
export function POST() {
  return NextResponse.json({ error: "Not used" }, { status: 404 });
}
