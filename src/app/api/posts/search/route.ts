import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    
    if (!query || query.trim() === "") {
      return NextResponse.json(
        { error: "\u641c\u7d22\u5173\u952e\u8bcd\u4e0d\u80fd\u4e3a\u7a7a" },
        { status: 400 }
      );
    }

    // Search from the actual database
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        category: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("\u641c\u7d22\u5e16\u5b50\u5931\u8d25:", error);
    return NextResponse.json(
      { error: "\u641c\u7d22\u5e16\u5b50\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5" },
      { status: 500 }
    );
  }
}
