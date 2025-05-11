// 修复并确保所有四个板块都存在且有正确的描述
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 定义所有需要的板块
    const categories = [
      { id: '1', name: '考研交流', description: '分享考研经验、资料与备考心得的平台' },
      { id: '2', name: '游戏人生', description: '探讨各类游戏、分享游戏心得与攻略' },
      { id: '3', name: '情感树屋', description: '倾诉情感故事、寻求情感建议的温馨角落' },
      { id: '4', name: '风景美食', description: '分享美丽风景与美食体验的空间' }
    ];

    // 首先删除所有现有的板块
    console.log('删除所有现有板块...');
    try {
      // 注意：这将删除所有与这些板块相关的帖子!
      // 如果需要保留帖子，应该采用更复杂的迁移策略
      await prisma.$executeRaw`DELETE FROM "Category"`;
    } catch (error) {
      console.error('删除板块时出错, 尝试另一种方法:', error.message);
      // 尝试一种替代方法
      for (const category of await prisma.category.findMany()) {
        try {
          await prisma.category.delete({ where: { id: category.id } });
        } catch (e) {
          console.error(`无法删除板块 ${category.id}: ${e.message}`);
        }
      }
    }

    // 创建新的板块
    console.log('创建新板块...');
    for (const category of categories) {
      console.log(`创建板块: ${category.name}`);
      try {
        await prisma.category.create({ data: category });
      } catch (error) {
        console.error(`创建板块 ${category.name} 时出错:`, error.message);
        // 尝试更新而不是创建
        try {
          await prisma.category.upsert({
            where: { id: category.id },
            create: category,
            update: category,
          });
        } catch (e) {
          console.error(`更新板块 ${category.name} 时也出错:`, e.message);
        }
      }
    }

    // 验证结果
    console.log('检查板块列表:');
    const updatedCategories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    updatedCategories.forEach(cat => {
      console.log(`${cat.id}: ${cat.name} - ${cat.description}`);
    });

    if (updatedCategories.length !== categories.length) {
      console.warn(`警告: 预期有 ${categories.length} 个板块，但只找到了 ${updatedCategories.length} 个`);
    }
  } catch (error) {
    console.error('脚本执行过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 