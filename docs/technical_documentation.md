---
marp: true
theme: default
size: 16:9
---

# 技术文档

---

## 1. 架构图（概要设计）

```mermaid
graph TD
    A[用户浏览器] --> B(Next.js 前端应用);
    B --> C{Next.js 后端 API};
    C --> D[Prisma ORM];
    D --> E[(PostgreSQL/SQLite 数据库)];

    subgraph "客户端"
        A
    end

    subgraph "服务器端 (Vercel / Node.js)"
        B
        C
        D
    end

    subgraph "数据存储"
        E
    end
```

**描述:**
这是一个基于 Next.js 的全栈 Web 应用架构。
- **用户浏览器**: 用户通过浏览器访问应用。
- **Next.js 前端应用**: 负责UI渲染、用户交互，使用 React 构建。
- **Next.js 后端 API**: 处理业务逻辑、数据请求，通过 API Routes 实现。
- **Prisma ORM**: 作为数据库的抽象层，简化数据库操作。
- **数据库**: 存储应用数据 (例如用户信息、帖子、评论等)。

---

## 2. 时序图（分析） - 用户注册流程

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Frontend as Next.js 前端
    participant Backend as Next.js API (/api/register)
    participant DB as 数据库 (Prisma)

    User->>Frontend: 访问注册页面
    Frontend->>User: 显示注册表单
    User->>Frontend: 填写表单并提交 (用户名, 邮箱, 密码)
    Frontend->>Backend: POST /api/register (注册信息)
    Backend->>DB: 检查用户名/邮箱是否已存在
    alt 用户名/邮箱已存在
        DB->>Backend: 用户已存在
        Backend->>Frontend: 返回错误信息 (用户已存在)
        Frontend->>User: 显示错误提示
    else 用户名/邮箱可用
        DB->>Backend: 用户不存在
        Backend->>Backend: 哈希密码
        Backend->>DB: 创建新用户记录
        DB->>Backend: 用户创建成功
        Backend->>Frontend: 返回成功信息 (用户创建成功)
        Frontend->>User: 显示成功提示 / 跳转登录页
    end
```

**描述:**
此图展示了用户注册功能的交互流程。

---

### 2.1 用户登录流程

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Frontend as Next.js 前端
    participant Backend as Next.js API (/api/auth/callback/credentials)
    participant DB as 数据库 (Prisma)

    User->>Frontend: 访问登录页面
    Frontend->>User: 显示登录表单
    User->>Frontend: 填写表单并提交 (邮箱/用户名, 密码)
    Frontend->>Backend: POST /api/auth/callback/credentials (登录信息)
    Backend->>DB: 查询用户信息 (邮箱/用户名)
    alt 用户不存在或密码错误
        DB->>Backend: 用户不存在 / 密码不匹配
        Backend->>Frontend: 返回错误信息 (无效的凭证)
        Frontend->>User: 显示错误提示
    else 用户存在且密码正确
        DB->>Backend: 用户信息
        Backend->>Backend: 生成 Session/JWT
        Backend->>Frontend: 返回成功信息 (包含 Session/JWT)
        Frontend->>User: 保存 Session/JWT, 跳转到首页/用户仪表盘
    end
```

**描述:**
此图展示了用户登录功能的交互流程。

---

### 2.2 创建新帖子流程

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Frontend as Next.js 前端
    participant Backend as Next.js API (/api/posts)
    participant DB as 数据库 (Prisma)

    User->>Frontend: 访问创建帖子页面/打开创建帖子表单
    Frontend->>User: 显示创建帖子表单 (标题, 内容, 分类等)
    User->>Frontend: 填写表单并提交
    Frontend->>Backend: POST /api/posts (帖子数据)
    Backend->>DB: 验证分类是否存在 (categoryId)
    alt 分类不存在
        DB->>Backend: 分类未找到
        Backend->>Frontend: 返回错误信息 (无效的分类)
        Frontend->>User: 显示错误提示
    else 分类存在
        DB->>Backend: 分类有效
        Backend->>DB: 创建新帖子记录 (关联作者, 分类)
        DB->>Backend: 帖子创建成功
        Backend->>Frontend: 返回成功信息 (新帖子数据)
        Frontend->>User: 显示成功提示 / 跳转到帖子详情页
    end
```

**描述:**
此图展示了用户创建新帖子的交互流程。

---

### 2.3 创建新评论流程

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Frontend as Next.js 前端
    participant Backend as Next.js API (/api/comments)
    participant DB as 数据库 (Prisma)

    User->>Frontend: 在帖子详情页填写评论内容并提交
    Frontend->>Backend: POST /api/comments (评论内容, postId, authorId)
    Backend->>DB: 验证帖子是否存在 (postId)
    alt 帖子不存在
        DB->>Backend: 帖子未找到
        Backend->>Frontend: 返回错误信息 (无效的帖子ID)
        Frontend->>User: 显示错误提示
    else 帖子存在
        DB->>Backend: 帖子有效
        Backend->>DB: 创建新评论记录 (关联作者, 帖子)
        DB->>Backend: 评论创建成功
        Backend->>Frontend: 返回成功信息 (新评论数据)
        Frontend->>User: 显示新评论 / 刷新评论列表
    end
```

**描述:**
此图展示了用户创建新评论的交互流程。

---

### 2.4 读取帖子列表流程

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Frontend as Next.js 前端
    participant Backend as Next.js API (/api/posts)
    participant DB as 数据库 (Prisma)

    User->>Frontend: 访问首页/分类页/搜索结果页
    Frontend->>Backend: GET /api/posts (可选参数: categoryId, searchTerm, page, limit)
    Backend->>DB: 根据参数查询帖子列表 (分页, 排序)
    DB->>Backend: 返回帖子列表数据
    Backend->>Frontend: 返回帖子列表 (JSON)
    Frontend->>User: 显示帖子列表
end
```

**描述:**
此图展示了用户读取帖子列表的交互流程。

---

### 2.5 读取单个帖子详情流程

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Frontend as Next.js 前端
    participant Backend as Next.js API (/api/posts/[postId])
    participant DB as 数据库 (Prisma)

    User->>Frontend: 点击帖子链接/访问帖子详情页URL
    Frontend->>Backend: GET /api/posts/[postId]
    Backend->>DB: 查询指定ID的帖子及其关联数据 (作者, 分类, 评论)
    alt 帖子不存在
        DB->>Backend: 帖子未找到
        Backend->>Frontend: 返回404错误
        Frontend->>User: 显示帖子未找到页面
    else 帖子存在
        DB->>Backend: 返回帖子数据
        Backend->>Frontend: 返回帖子详情 (JSON)
        Frontend->>User: 显示帖子内容、评论等
    end
```

**描述:**
此图展示了用户读取单个帖子详情的交互流程。

---

### 2.6 更新帖子流程

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Frontend as Next.js 前端
    participant Backend as Next.js API (/api/posts/[postId])
    participant DB as 数据库 (Prisma)

    User->>Frontend: 在帖子详情页点击编辑按钮/访问编辑帖子页面
    Frontend->>User: 显示预填好帖子内容的编辑表单
    User->>Frontend: 修改表单内容并提交
    Frontend->>Backend: PUT /api/posts/[postId] (更新后的帖子数据)
    Backend->>DB: 验证用户是否有权限编辑该帖子 (例如, 是否为作者或管理员)
    alt 无权限
        DB->>Backend: 权限不足
        Backend->>Frontend: 返回403错误 (禁止访问)
        Frontend->>User: 显示错误提示 (无权限编辑)
    else 有权限
        Backend->>DB: 验证分类是否存在 (如果分类被修改)
        alt 分类不存在
            DB->>Backend: 分类未找到
            Backend->>Frontend: 返回错误信息 (无效的分类)
            Frontend->>User: 显示错误提示
        else 分类存在或未修改
            DB->>Backend: 分类有效
            Backend->>DB: 更新帖子记录, editCount + 1
            DB->>Backend: 帖子更新成功
            Backend->>Frontend: 返回成功信息 (更新后的帖子数据)
            Frontend->>User: 显示成功提示 / 跳转到帖子详情页
        end
    end
```

**描述:**
此图展示了用户更新帖子的交互流程。

---

### 2.7 删除帖子流程

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Frontend as Next.js 前端
    participant Backend as Next.js API (/api/posts/[postId])
    participant DB as 数据库 (Prisma)

    User->>Frontend: 在帖子详情页点击删除按钮
    Frontend->>User: 弹出确认删除对话框
    User->>Frontend: 确认删除
    Frontend->>Backend: DELETE /api/posts/[postId]
    Backend->>DB: 验证用户是否有权限删除该帖子 (例如, 是否为作者或管理员)
    alt 无权限
        DB->>Backend: 权限不足
        Backend->>Frontend: 返回403错误 (禁止访问)
        Frontend->>User: 显示错误提示 (无权限删除)
    else 有权限
        DB->>Backend: 权限验证通过
        Backend->>DB: 删除帖子记录 (及其关联的评论、违规记录等)
        DB->>Backend: 帖子删除成功
        Backend->>Frontend: 返回成功信息
        Frontend->>User: 显示成功提示 / 跳转到首页或分类页
    end
```

**描述:**
此图展示了用户删除帖子的交互流程。

---

### 2.8 更新评论流程

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Frontend as Next.js 前端
    participant Backend as Next.js API (/api/comments/[commentId])
    participant DB as 数据库 (Prisma)

    User->>Frontend: 在帖子详情页找到自己的评论并点击编辑按钮
    Frontend->>User: 显示评论编辑框 (预填原始内容)
    User->>Frontend: 修改评论内容并提交
    Frontend->>Backend: PUT /api/comments/[commentId] (更新后的评论内容)
    Backend->>DB: 验证用户是否有权限编辑该评论 (例如, 是否为作者或管理员)
    alt 无权限
        DB->>Backend: 权限不足
        Backend->>Frontend: 返回403错误 (禁止访问)
        Frontend->>User: 显示错误提示 (无权限编辑)
    else 有权限
        DB->>Backend: 权限验证通过
        Backend->>DB: 更新评论记录, editCount + 1
        DB->>Backend: 评论更新成功
        Backend->>Frontend: 返回成功信息 (更新后的评论数据)
        Frontend->>User: 显示更新后的评论 / 刷新评论列表
    end
```

**描述:**
此图展示了用户更新评论的交互流程。

---

### 2.9 删除评论流程

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant Frontend as Next.js 前端
    participant Backend as Next.js API (/api/comments/[commentId])
    participant DB as 数据库 (Prisma)

    User->>Frontend: 在帖子详情页找到自己的评论并点击删除按钮
    Frontend->>User: 弹出确认删除对话框
    User->>Frontend: 确认删除
    Frontend->>Backend: DELETE /api/comments/[commentId]
    Backend->>DB: 验证用户是否有权限删除该评论 (例如, 是否为作者或管理员)
    alt 无权限
        DB->>Backend: 权限不足
        Backend->>Frontend: 返回403错误 (禁止访问)
        Frontend->>User: 显示错误提示 (无权限删除)
    else 有权限
        DB->>Backend: 权限验证通过
        Backend->>DB: 删除评论记录
        DB->>Backend: 评论删除成功
        Backend->>Frontend: 返回成功信息
        Frontend->>User: 从界面移除评论 / 刷新评论列表
    end
```

**描述:**
此图展示了用户删除评论的交互流程。

---

## 3. 类图（详细设计）

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String username
        +String password
        +Boolean isAdmin
        +Int creditScore
        +DateTime? banUntil
        +String? contactInfo
        +String? signature
        +String? avatar
        +DateTime createdAt
        +DateTime updatedAt
        +Comment[] comments
        +Post[] posts
        +PostViolation[] violationMarkedPosts
        +CommentViolation[] violationMarkedComments
        +UserInbox[] inbox
    }

    class Category {
        +String id
        +String name
        +String? description
        +Post[] posts
    }

    class Post {
        +String id
        +String title
        +String content
        +DateTime createdAt
        +DateTime updatedAt
        +String authorId
        +String categoryId
        +Boolean isViolation
        +Int editCount
        +Comment[] comments
        +Category category
        +User author
        +PostViolation[] violations
    }

    class Comment {
        +String id
        +String content
        +DateTime createdAt
        +DateTime updatedAt
        +String authorId
        +String postId
        +Boolean isViolation
        +Int editCount
        +Post post
        +User author
        +CommentViolation[] violations
    }

    class PostViolation {
        +String id
        +String postId
        +String adminId
        +String reason
        +Int pointsDeducted
        +DateTime createdAt
        +Post post
        +User markedByAdmin
    }

    class CommentViolation {
        +String id
        +String commentId
        +String adminId
        +String reason
        +Int pointsDeducted
        +DateTime createdAt
        +Comment comment
        +User markedByAdmin
    }

    class UserInbox {
        +String id
        +String userId
        +String message
        +String type
        +String? relatedPostId
        +String? relatedCommentId
        +Boolean isRead
        +DateTime createdAt
        +User user
    }

    User "1" -- "0..*" Post : authors
    User "1" -- "0..*" Comment : authors
    User "1" -- "0..*" PostViolation : marks (as admin)
    User "1" -- "0..*" CommentViolation : marks (as admin)
    User "1" -- "0..*" UserInbox : has

    Category "1" -- "0..*" Post : contains

    Post "1" -- "0..*" Comment : has
    Post "1" -- "0..*" PostViolation : has

    Comment "1" -- "0..*" CommentViolation : has

```

**描述:**
基于 Prisma Schema 的主要实体类及其关系。

---

## 4. 实体关系图 (ERD - 可选)

```mermaid
erDiagram
    USER {
        string id PK
        string email UK
        string username UK
        string password
        boolean isAdmin
        int creditScore
        datetime banUntil "Nullable"
        string contactInfo "Nullable"
        string signature "Nullable"
        string avatar "Nullable"
        datetime createdAt
        datetime updatedAt
    }

    CATEGORY {
        string id PK
        string name UK
        string description "Nullable"
    }

    POST {
        string id PK
        string title
        string content
        datetime createdAt
        datetime updatedAt
        string authorId FK
        string categoryId FK
        boolean isViolation
        int editCount
    }

    COMMENT {
        string id PK
        string content
        datetime createdAt
        datetime updatedAt
        string authorId FK
        string postId FK
        boolean isViolation
        int editCount
    }

    POST_VIOLATION {
        string id PK
        string postId FK
        string adminId FK
        string reason
        int pointsDeducted
        datetime createdAt
    }

    COMMENT_VIOLATION {
        string id PK
        string commentId FK
        string adminId FK
        string reason
        int pointsDeducted
        datetime createdAt
    }

    USER_INBOX {
        string id PK
        string userId FK
        string message
        string type
        string relatedPostId "Nullable"
        string relatedCommentId "Nullable"
        boolean isRead
        datetime createdAt
    }

    USER ||--o{ POST : "authors"
    USER ||--o{ COMMENT : "authors"
    USER ||--o{ POST_VIOLATION : "marks (as admin)"
    USER ||--o{ COMMENT_VIOLATION : "marks (as admin)"
    USER ||--o{ USER_INBOX : "has"

    CATEGORY ||--o{ POST : "contains"

    POST ||--o{ COMMENT : "has"
    POST ||--o{ POST_VIOLATION : "has"

    COMMENT ||--o{ COMMENT_VIOLATION : "has"

```

**描述:**
数据库实体及其关系图，基于 Prisma Schema。

---

## 5. 数据库结构

### User 表
| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| id | String | 主键，UUID |
| email | String | 唯一，用户邮箱 |
| username | String | 唯一，用户名 |
| password | String | 密码（已加密） |
| isAdmin | Boolean | 是否为管理员，默认 false |
| creditScore | Int | 信用分数，默认 100 |
| banUntil | DateTime? | 封禁截止时间，可为空 |
| contactInfo | String? | 联系信息，可为空 |
| signature | String? | 个性签名，可为空 |

---

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| avatar | String? | 头像URL，可为空 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |
| comments | Comment[] | 关联的评论 |
| posts | Post[] | 关联的帖子 |
| violationMarkedPosts | PostViolation[] | 作为管理员标记的违规帖子 |
| violationMarkedComments | CommentViolation[] | 作为管理员标记的违规评论 |
| inbox | UserInbox[] | 用户收件箱 |

---

### Category 表
| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| id | String | 主键，UUID |
| name | String | 唯一，分类名称 |
| description | String? | 分类描述，可为空 |
| posts | Post[] | 关联的帖子 |
---

### Post 表
| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| id | String | 主键，UUID |
| title | String | 帖子标题 |
| content | String | 帖子内容 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |
| authorId | String | 外键，关联User表 |
| categoryId | String | 外键，关联Category表 |
| isViolation | Boolean | 是否被标记为违规，默认 false |
| editCount | Int | 编辑次数，默认 0 |

---

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| comments | Comment[] | 关联的评论 |
| category | Category | 关联的分类 |
| author | User | 关联的作者 |
| violations | PostViolation[] | 违规记录 |

---

### Comment 表
| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| id | String | 主键，UUID |
| content | String | 评论内容 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |
| authorId | String | 外键，关联User表 |
| postId | String | 外键，关联Post表 |
| isViolation | Boolean | 是否被标记为违规，默认 false |
| editCount | Int | 编辑次数，默认 0 |
| post | Post | 关联的帖子 |

---

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| author | User | 关联的作者 |
| violations | CommentViolation[] | 违规记录 |

---

### PostViolation 表
| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| id | String | 主键，UUID |
| postId | String | 外键，关联Post表 |
| adminId | String | 外键，关联User表（管理员） |
| reason | String | 违规原因 |
| pointsDeducted | Int | 扣除的信用分数 |
| createdAt | DateTime | 创建时间 |
| post | Post | 关联的帖子 |
| markedByAdmin | User | 关联的管理员 |

注：每个帖子只能被同一管理员标记一次违规（postId和adminId的组合唯一）

---

### CommentViolation 表
| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| id | String | 主键，UUID |
| commentId | String | 外键，关联Comment表 |
| adminId | String | 外键，关联User表（管理员） |
| reason | String | 违规原因 |
| pointsDeducted | Int | 扣除的信用分数 |
| createdAt | DateTime | 创建时间 |
| comment | Comment | 关联的评论 |
| markedByAdmin | User | 关联的管理员 |

注：每条评论只能被同一管理员标记一次违规（commentId和adminId的组合唯一）

---

### UserInbox 表
| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| id | String | 主键，UUID |
| userId | String | 外键，关联User表 |
| message | String | 消息内容 |
| type | String | 消息类型（post_violation/comment_violation/system等） |
| relatedPostId | String? | 相关帖子ID，可为空 |
| relatedCommentId | String? | 相关评论ID，可为空 |
| isRead | Boolean | 是否已读，默认 false |
| createdAt | DateTime | 创建时间 |
| user | User | 关联的用户 |

---

