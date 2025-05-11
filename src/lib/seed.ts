import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedCategories() {
  try {
    // 检查是否已有分类数据
    const count = await prisma.category.count();
    if (count > 0) {
      // 分类数据已存在，跳过初始化
      return;
    }

    // 创建初始分类数据
    await prisma.category.createMany({
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

    // 初始化了分类数据
  } catch {
    // 初始化分类数据失败
  } finally {
    await prisma.$disconnect();
  }
}
