import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 这个API路由用于初始化数据库，添加初始分类数据
export async function GET() {
  try {
    // 检查数据库中是否已有分类数据
    const existingCategories = await prisma.category.findMany();
    
    // 如果已经有数据，则不再重复添加
    if (existingCategories.length > 0) {
      return NextResponse.json({
        message: "数据库已有初始数据，无需重新初始化",
        categories: existingCategories
      });
    }
    
    // 创建初始分类数据
    const categories = await prisma.category.createMany({
      data: [
        {
          id: "1",
          name: "考研交流",
          description: "关于考研经验、复习方法的交流板块"
        },
        {
          id: "2",
          name: "专业论坛",
          description: "各专业学习资料与经验分享"
        },
        {
          id: "3",
          name: "校园生活",
          description: "分享校园生活趣事、活动信息"
        },
        {
          id: "4",
          name: "学习交流",
          description: "日常学习问题交流与答疑"
        }
      ]
    });
    
    // 重新获取所有分类数据返回给客户端
    const allCategories = await prisma.category.findMany();
    
    return NextResponse.json({
      message: "数据库初始化成功",
      categories: allCategories
    });
  } catch (error) {
    console.error("初始化数据库失败:", error);
    return NextResponse.json(
      { error: "初始化数据库失败，请查看服务器日志" },
      { status: 500 }
    );
  }
}
