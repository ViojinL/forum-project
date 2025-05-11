// 仅更新板块描述，保留现有板块ID和帖子关联
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 定义所需的板块和描述
    const categoryUpdates = [
      { id: '1', name: '考研交流', description: '分享考研经验、资料与备考心得的平台' },
      { id: '2', name: '游戏人生', description: '探讨各类游戏、分享游戏心得与攻略' },
      { id: '3', name: '情感树屋', description: '倾诉情感故事、寻求情感建议的温馨角落' },
      { id: '4', name: '风景美食', description: '分享美丽风景与美食体验的空间' }
    ];

    console.log('获取现有板块...');
    const existingCategories = await prisma.category.findMany();
    
    if (existingCategories.length === 0) {
      console.log('数据库中没有板块，创建新板块...');
      for (const category of categoryUpdates) {
        console.log(`创建板块: ${category.name}`);
        await prisma.category.create({ data: category });
      }
    } else {
      console.log('现有板块:');
      existingCategories.forEach(cat => {
        console.log(`${cat.id}: ${cat.name} - ${cat.description || '无描述'}`);
      });

      // 更新现有板块的名称和描述
      console.log('\n更新板块描述...');
      for (const update of categoryUpdates) {
        const existing = existingCategories.find(c => c.id === update.id);
        
        if (existing) {
          console.log(`更新板块 ${update.id}: ${existing.name} -> ${update.name}`);
          try {
            await prisma.category.update({
              where: { id: update.id },
              data: {
                name: update.name,
                description: update.description
              }
            });
          } catch (error) {
            console.error(`更新板块 ${update.id} 失败:`, error.message);
          }
        } else {
          console.log(`创建新板块 ${update.id}: ${update.name}`);
          try {
            await prisma.category.create({ data: update });
          } catch (error) {
            console.error(`创建板块 ${update.id} 失败:`, error.message);
          }
        }
      }
    }

    // 验证结果
    console.log('\n更新后的板块列表:');
    const updatedCategories = await prisma.category.findMany({
      orderBy: { id: 'asc' }
    });
    
    if (updatedCategories.length === 0) {
      console.log('警告：数据库中没有板块！');
    } else {
      updatedCategories.forEach(cat => {
        console.log(`${cat.id}: ${cat.name} - ${cat.description || '无描述'}`);
      });
    }
    
    console.log('\n完成！');
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