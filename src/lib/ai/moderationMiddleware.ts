/**
 * 内容审核中间件
 * 用于在创建/更新帖子和评论时自动进行内容审核
 */
import { NextRequest, NextResponse } from 'next/server';
import { moderationService } from './moderationService';

type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

interface PostBody {
  id?: string;
  title?: string;
  content?: string;
  authorId?: string;
  [key: string]: unknown;
}

interface CommentBody {
  id?: string;
  content?: string;
  authorId?: string;
  [key: string]: unknown;
}

interface ResponseData {
  id?: string;
  title?: string;
  content?: string;
  authorId?: string;
  [key: string]: unknown;
}

// 克隆请求并解析JSON体
async function cloneRequestAndParseBody<T>(req: NextRequest): Promise<{ clonedReq: NextRequest, body: T }> {
  try {
    const body = await req.json() as T;
    // 创建一个新的NextRequest
    const clonedReq = new NextRequest(req.url, {
      method: req.method,
      headers: req.headers,
      // 不需要添加body，因为我们只需要传递请求到处理程序
      cache: req.cache,
      credentials: req.credentials,
      mode: req.mode,
      redirect: req.redirect,
      referrer: req.referrer,
      referrerPolicy: req.referrerPolicy
    });
    return { clonedReq, body };
  } catch (error) {
    console.error('解析请求体失败:', error);
    throw error;
  }
}

// 帖子创建/更新请求处理中间件
export async function postModerationMiddleware(
  req: NextRequest,
  handler: ApiHandler
): Promise<NextResponse> {
  // 只处理POST和PUT请求
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return handler(req);
  }
  
  try {
    const { clonedReq, body } = await cloneRequestAndParseBody<PostBody>(req);
    
    // 如果是创建新帖子
    if (req.method === 'POST' && body.title && body.content && body.authorId) {
      // 先让原始处理程序处理请求
      const response = await handler(clonedReq);
      
      // 如果请求成功
      if (response.ok) {
        try {
          // 获取响应数据
          const responseData = await response.clone().json() as ResponseData;
          
          // 如果有帖子ID，进行内容审核
          if (responseData.id && typeof responseData.id === 'string') {
            // 异步进行内容审核，不阻塞响应
            moderationService.moderatePost(
              responseData.id,
              String(body.content || ''),
              String(body.title || ''),
              String(body.authorId || '')
            ).catch(error => {
              console.error('帖子内容审核失败:', error);
            });
          }
        } catch (error) {
          console.error('解析响应数据失败:', error);
        }
      }
      
      return response;
    }
    
    // 如果是更新帖子
    if (req.method === 'PUT' && body.id && (body.title || body.content)) {
      // 先让原始处理程序处理请求
      const response = await handler(clonedReq);
      
      // 如果请求成功
      if (response.ok) {
        try {
          // 获取响应数据
          const responseData = await response.clone().json() as ResponseData;
          
          // 进行内容审核
          if (typeof body.id === 'string') {
            moderationService.moderatePost(
              body.id,
              String(body.content || responseData.content || ''),
              String(body.title || responseData.title || ''),
              String(body.authorId || responseData.authorId || '')
            ).catch(error => {
              console.error('更新帖子内容审核失败:', error);
            });
          }
        } catch (error) {
          console.error('解析响应数据失败:', error);
        }
      }
      
      return response;
    }
    
    // 其他情况，直接处理请求
    return handler(req);
  } catch (error) {
    console.error('帖子审核中间件错误:', error);
    // 出错时继续处理原始请求
    return handler(req);
  }
}

// 评论创建/更新请求处理中间件
export async function commentModerationMiddleware(
  req: NextRequest,
  handler: ApiHandler
): Promise<NextResponse> {
  // 只处理POST和PUT请求
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return handler(req);
  }
  
  try {
    const { clonedReq, body } = await cloneRequestAndParseBody<CommentBody>(req);
    
    // 如果是创建新评论
    if (req.method === 'POST' && body.content && body.authorId) {
      // 先让原始处理程序处理请求
      const response = await handler(clonedReq);
      
      // 如果请求成功
      if (response.ok) {
        try {
          // 获取响应数据
          const responseData = await response.clone().json() as ResponseData;
          
          // 如果有评论ID，进行内容审核
          if (responseData.id && typeof responseData.id === 'string') {
            // 异步进行内容审核，不阻塞响应
            moderationService.moderateComment(
              responseData.id,
              String(body.content || ''),
              String(body.authorId || '')
            ).catch(error => {
              console.error('评论内容审核失败:', error);
            });
          }
        } catch (error) {
          console.error('解析响应数据失败:', error);
        }
      }
      
      return response;
    }
    
    // 如果是更新评论
    if (req.method === 'PUT' && body.id && body.content) {
      // 先让原始处理程序处理请求
      const response = await handler(clonedReq);
      
      // 如果请求成功
      if (response.ok) {
        try {
          // 获取响应数据
          const responseData = await response.clone().json() as ResponseData;
          
          // 进行内容审核
          if (typeof body.id === 'string') {
            moderationService.moderateComment(
              body.id,
              String(body.content || ''),
              String(body.authorId || responseData.authorId || '')
            ).catch(error => {
              console.error('更新评论内容审核失败:', error);
            });
          }
        } catch (error) {
          console.error('解析响应数据失败:', error);
        }
      }
      
      return response;
    }
    
    // 其他情况，直接处理请求
    return handler(req);
  } catch (error) {
    console.error('评论审核中间件错误:', error);
    // 出错时继续处理原始请求
    return handler(req);
  }
}
