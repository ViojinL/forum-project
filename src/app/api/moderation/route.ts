import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SimpleModerationService } from "@/services/simpleModerationService";

// 帖子审核API
export async function POST(req: NextRequest) {
  try {
    // 验证是否为管理员或系统调用
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { type, id, content, authorId } = await req.json();
    
    if (!type || !id || !content || !authorId) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }
    
    let result;
    
    // 根据类型调用不同的审核方法
    if (type === "post") {
      result = await SimpleModerationService.moderatePost(id, content, authorId);
    } else if (type === "comment") {
      result = await SimpleModerationService.moderateComment(id, content, authorId);
    } else {
      return NextResponse.json({ error: "无效的审核类型" }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("AI审核处理失败:", error);
    return NextResponse.json(
      { error: "AI审核处理失败，请稍后再试" },
      { status: 500 }
    );
  }
}

// 获取审核配置
export async function GET() {
  try {
    const config = await SimpleModerationService.getConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("获取AI审核配置失败:", error);
    return NextResponse.json(
      { error: "获取AI审核配置失败，请稍后再试" },
      { status: 500 }
    );
  }
}
