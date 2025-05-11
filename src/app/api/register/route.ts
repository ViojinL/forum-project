import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json();

    // 验证输入
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "请填写所有必填字段" },
        { status: 400 }
      );
    }

    // 邮箱格式验证
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "请输入有效的邮箱地址" },
        { status: 400 }
      );
    }
    
    // 教育邮箱验证
    const eduDomains = [".edu", ".edu.cn", ".ac.cn", ".ac.uk", ".ac.jp"];
    const isEduEmail = eduDomains.some(domain => email.toLowerCase().endsWith(domain));
    if (!isEduEmail) {
      return NextResponse.json(
        { error: "请使用教育邮箱地址（如.edu或.edu.cn结尾的邮箱）" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已被使用
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    // 检查用户名是否已被使用
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "该用户名已被使用" },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    // 直接构造 userWithoutPassword 对象
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json(
      { message: "注册成功", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { error: "注册过程中发生错误" },
      { status: 500 }
    );
  }
}
