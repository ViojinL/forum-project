// 为空数据库初始化必要数据
const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('开始初始化数据库...');
    
    // 1. 创建板块
    console.log('创建论坛板块...');
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

    for (const category of categories) {
      const exists = await prisma.category.findFirst({
        where: { name: category.name }
      });

      if (!exists) {
        await prisma.category.create({
          data: category
        });
        console.log(`✓ 已创建板块: ${category.name}`);
      } else {
        console.log(`- 板块已存在: ${category.name}`);
      }
    }

    // 2. 创建根管理员账户
    console.log('\n创建根管理员账户...');
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'root@admin.edu' }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const newAdmin = await prisma.user.create({
        data: {
          email: 'root@admin.edu',
          username: 'RootAdmin',
          password: hashedPassword,
          isAdmin: true,
          creditScore: 100
        }
      });
      console.log(`✓ 已创建根管理员: ${newAdmin.username} (${newAdmin.email})`);
    } else {
      console.log(`- 管理员已存在: ${existingAdmin.username} (${existingAdmin.email})`);
    }

    // 3. 创建一些示例用户
    console.log('\n创建示例用户...');
    const users = [
      { username: "学生小王", email: "student1@example.com", password: "123456" },
      { username: "学生小李", email: "student2@example.com", password: "123456" },
      { username: "学生小张", email: "student3@example.com", password: "123456" }
    ];

    for (const user of users) {
      const exists = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (!exists) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await prisma.user.create({
          data: {
            email: user.email,
            username: user.username,
            password: hashedPassword,
            creditScore: 100
          }
        });
        console.log(`✓ 已创建用户: ${user.username}`);
      } else {
        console.log(`- 用户已存在: ${user.username}`);
      }
    }

    // 4. 创建一些示例帖子
    console.log('\n创建示例帖子...');
    
    // 获取用户和分类
    const allUsers = await prisma.user.findMany();
    const allCategories = await prisma.category.findMany();
    
    if (allUsers.length > 0 && allCategories.length > 0) {
      const posts = [
        {
          title: "考研备考经验分享",
          content: "我是去年上岸的学长，想分享一下我的考研备考经验。首先，制定合理的计划非常重要...",
          categoryId: allCategories.find(c => c.name === "考研交流")?.id || allCategories[0].id,
          authorId: allUsers[0].id
        },
        {
          title: "推荐几款解压游戏",
          content: "最近学习压力比较大，想推荐几款我平时用来放松的小游戏，希望对大家有帮助...",
          categoryId: allCategories.find(c => c.name === "游戏人生")?.id || allCategories[1].id,
          authorId: allUsers[1].id
        },
        {
          title: "校园暗恋那些事",
          content: "大学时光总是充满了各种暗恋的小故事，今天来分享一下我身边朋友的真实经历...",
          categoryId: allCategories.find(c => c.name === "情感树屋")?.id || allCategories[2].id,
          authorId: allUsers[2].id
        }
      ];
      
      for (const post of posts) {
        await prisma.post.create({
          data: post
        });
        console.log(`✓ 已创建帖子: ${post.title}`);
      }
      
      // 5. 创建一些评论
      console.log('\n创建示例评论...');
      const allPosts = await prisma.post.findMany();
      
      if (allPosts.length > 0) {
        const comments = [
          {
            content: "非常感谢分享，对我帮助很大！",
            postId: allPosts[0].id,
            authorId: allUsers[1].id
          },
          {
            content: "我也来补充一点我的经验...",
            postId: allPosts[0].id,
            authorId: allUsers[2].id
          },
          {
            content: "这些游戏我都玩过，确实很解压！",
            postId: allPosts[1].id,
            authorId: allUsers[0].id
          }
        ];
        
        for (const comment of comments) {
          await prisma.comment.create({
            data: comment
          });
          console.log(`✓ 已创建评论: ${comment.content.substring(0, 20)}...`);
        }
      }
    }

    console.log('\n✓ 数据库初始化完成!');
  } catch (error) {
    console.error('初始化数据库失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 