import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOperator } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  message: string;
  createdAt: string;
};

export async function GET(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = db
    .prepare("SELECT * FROM inquiries ORDER BY datetime(createdAt) DESC LIMIT 500")
    .all() as InquiryRow[];
  return NextResponse.json({ inquiries: rows });
}
