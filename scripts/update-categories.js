// 更新论坛板块名称的脚本
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('获取当前所有板块...');
    const existingCategories = await prisma.category.findMany();
    console.log('当前板块:');
    existingCategories.forEach(cat => console.log(`${cat.id}: ${cat.name}`));

    // 新的板块名称
    const newCategoryNames = ['考研交流', '游戏人生', '情感树屋', '风景美食'];
    
    // 获取当前所有板块ID
    const categoryIds = existingCategories.map(cat => cat.id);
    
    // 确保我们有足够的ID来更新
    if (categoryIds.length < newCategoryNames.length) {
      // 创建新板块
      for (let i = categoryIds.length; i < newCategoryNames.length; i++) {
        console.log(`创建新板块: ${newCategoryNames[i]}`);
        await prisma.category.create({
          data: {
            name: newCategoryNames[i],
            description: `欢迎来到${newCategoryNames[i]}板块！`
          }
        });
      }
    } else if (categoryIds.length > newCategoryNames.length) {
      // 仅更新前几个，其他保留不动
      console.log(`注意: 只更新前 ${newCategoryNames.length} 个板块，其余 ${categoryIds.length - newCategoryNames.length} 个板块将保持不变`);
    }
    
    // 更新已有板块的名称
    for (let i = 0; i < Math.min(categoryIds.length, newCategoryNames.length); i++) {
      console.log(`更新板块 ${existingCategories[i].name} -> ${newCategoryNames[i]}`);
      await prisma.category.update({
        where: { id: categoryIds[i] },
        data: { 
          name: newCategoryNames[i],
          description: `欢迎来到${newCategoryNames[i]}板块！`
        }
      });
    }

    console.log('板块名称更新完成！');
    console.log('新的板块列表:');
    const updatedCategories = await prisma.category.findMany();
    updatedCategories.forEach(cat => console.log(`${cat.id}: ${cat.name}`));
  } catch (error) {
    console.error('更新板块名称时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 