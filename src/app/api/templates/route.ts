import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getAuthSession();

  try {
    const templates = await prisma.template.findMany({
      where: session
        ? {
            OR: [{ isSystemTemplate: true }, { userId: session.userId }],
          }
        : { isSystemTemplate: true },
      orderBy: [{ isSystemTemplate: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, category, configuration } = body;

    if (!name || !configuration) {
      return NextResponse.json(
        { error: "Template name and configuration are required" },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        userId: session.userId,
        name,
        description: description || "",
        category: category || "Custom",
        configuration: typeof configuration === "string" ? configuration : JSON.stringify(configuration),
        isSystemTemplate: false,
      },
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
