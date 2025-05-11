// 更新论坛板块名称的脚本
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('获取当前所有板块...');
    const existingCategories = await prisma.category.findMany();
    console.log('当前板块:');
    existingCategories.forEach(cat => console.log(`${cat.id}: ${cat.name}`));

    // 定义每个ID应该对应的新板块名称
    const idToNewName = {
      '1': { name: '考研交流', description: '分享考研经验、资料与备考心得的平台' },
      '2': { name: '游戏人生', description: '探讨各类游戏、分享游戏心得与攻略' },
      '3': { name: '情感树屋', description: '倾诉情感故事、寻求情感建议的温馨角落' },
      '4': { name: '风景美食', description: '分享美丽风景与美食体验的空间' }
    };

    // 遍历现有板块进行更新
    for (const category of existingCategories) {
      const newInfo = idToNewName[category.id];
      if (newInfo) {
        if (category.name !== newInfo.name) {
          console.log(`更新板块 ${category.id}: ${category.name} -> ${newInfo.name}`);
          await prisma.category.update({
            where: { id: category.id },
            data: { 
              name: newInfo.name,
              description: newInfo.description
            }
          });
        } else {
          console.log(`板块 ${category.id} 名称已经是 ${newInfo.name}，无需更新`);
        }
      }
    }

    // 检查是否需要创建新板块
    const existingIds = existingCategories.map(c => c.id);
    for (const id in idToNewName) {
      if (!existingIds.includes(id)) {
        const newInfo = idToNewName[id];
        console.log(`创建新板块 ${id}: ${newInfo.name}`);
        await prisma.category.create({
          data: {
            id: id,
            name: newInfo.name,
            description: newInfo.description
          }
        });
      }
    }

    console.log('板块名称更新完成！');
    console.log('新的板块列表:');
    const updatedCategories = await prisma.category.findMany();
    updatedCategories.forEach(cat => console.log(`${cat.id}: ${cat.name} - ${cat.description}`));
  } catch (error) {
    console.error('更新板块名称时出错:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 