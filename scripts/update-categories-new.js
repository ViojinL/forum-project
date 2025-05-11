// 更新论坛板块为：考研交流、游戏人生、情感树屋、风景美食
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 新的板块数据
const categories = [
  {
    name: "考研交流",
    description: "分享考研经验、资料和备考心得，助力学子金榜题名。"
  },
  {
    name: "游戏人生",
    description: "探讨游戏攻略、分享游戏心得，畅聊游戏中的精彩瞬间。"
  },
  {
    name: "情感树屋",
    description: "分享情感故事、倾诉心灵感受，互相支持与鼓励。"
  },
  {
    name: "风景美食",
    description: "记录美丽风景、分享美食体验，探索生活中的美好。"
  }
];

async function updateCategories() {
  try {
    console.log('开始更新论坛板块...');
    
    // 获取现有板块
    const existingCategories = await prisma.category.findMany();
    console.log(`找到 ${existingCategories.length} 个现有板块`);
    
    // 如果存在现有板块，更新它们
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      
      if (i < existingCategories.length) {
        // 更新现有板块
        console.log(`更新板块: ${existingCategories[i].name} -> ${category.name}`);
        await prisma.category.update({
          where: { id: existingCategories[i].id },
          data: {
            name: category.name,
            description: category.description
          }
        });
      } else {
        // 创建新板块
        console.log(`创建新板块: ${category.name}`);
        await prisma.category.create({
          data: {
            name: category.name,
            description: category.description
          }
        });
      }
    }
    
    // 如果现有板块比新板块多，删除多余的
    if (existingCategories.length > categories.length) {
      for (let i = categories.length; i < existingCategories.length; i++) {
        console.log(`删除多余板块: ${existingCategories[i].name}`);
        await prisma.category.delete({
          where: { id: existingCategories[i].id }
        });
      }
    }
    
    // 验证更新
    const updatedCategories = await prisma.category.findMany();
    console.log('更新后的板块:');
    updatedCategories.forEach(cat => {
      console.log(`- ${cat.name}: ${cat.description}`);
    });
    
    console.log('板块更新完成');
  } catch (error) {
    console.error('更新板块失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCategories()
  .then(() => console.log('操作完成'))
  .catch(console.error); 