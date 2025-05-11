import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// u83b7u53d6u6240u6709u5206u7c7bu5217u8868
export async function GET() {
  try {
    // u67e5u8be2u6240u6709u5206u7c7buff0cu5e76u8ba1u7b97u6bcfu4e2au5206u7c7bu4e0bu7684u5e16u5b50u6570u91cf
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("u83b7u53d6u5206u7c7bu5217u8868u5931u8d25:", error);
    return NextResponse.json(
      { error: "u83b7u53d6u5206u7c7bu5217u8868u5931u8d25uff0cu8bf7u7a0du540eu518du8bd5" },
      { status: 500 }
    );
  }
}
