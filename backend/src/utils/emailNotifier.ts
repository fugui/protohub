/**
 * 邮件通知功能
 */

import nodemailer from 'nodemailer';

/**
 * 邮件配置
 */
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * 邮件配置（生产环境应从环境变量读取）
 */
const emailConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // false for 587, true for 465
  auth: {
    user: process.env.EMAIL_USER || 'noreply@protohub.com',
    pass: process.env.EMAIL_PASS || '',
  },
};

/**
 * 邮件发送器
 */
let transporter: nodemailer.Transporter | null = null;

/**
 * 获取邮件发送器
 */
function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });
  }
  return transporter;
}

/**
 * 发送邮件
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: emailConfig.auth.user,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`邮件已发送至: ${options.to}`);
  } catch (error: any) {
    console.error('邮件发送失败:', error);
    throw new Error(`邮件发送失败: ${error.message}`);
  }
}

/**
 * 发送审核批准邮件
 */
export async function sendApprovalEmail(
  userEmail: string,
  userName: string,
  fileName: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          h1 { margin: 0 0 20px 0; }
          .btn { display: inline-block; padding: 10px 20px; background: #1890ff; color: white;
                   text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ProtoHub - 审核通过</h1>
          </div>
          <div class="content">
            <p>尊敬的 ${userName}：</p>
            <p>您的 Proto 文件 <strong>${fileName}</strong> 已通过审核！</p>
            <p>文件状态已更新为"已批准"，可以继续进行下一步操作。</p>
            <a href="http://localhost:5173/files" class="btn">查看文件列表</a>
          </div>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>© ${new Date().getFullYear()} ProtoHub. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'ProtoHub - 审核通过',
    html,
    text: `您的 Proto 文件 ${fileName} 已通过审核`,
  });
}

/**
 * 发送审核拒绝邮件
 */
export async function sendRejectionEmail(
  userEmail: string,
  userName: string,
  fileName: string,
  reason: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff4d4f; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .reason { background: #fff3f0; color: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
          h1 { margin: 0 0 20px 0; }
          .btn { display: inline-block; padding: 10px 20px; background: #1890ff; color: white;
                   text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ProtoHub - 审核未通过</h1>
          </div>
          <div class="content">
            <p>尊敬的 ${userName}：</p>
            <p>您的 Proto 文件 <strong>${fileName}</strong> 未通过审核。</p>
            <div class="reason">
              <strong>拒绝原因：</strong>
              <p>${reason}</p>
            </div>
            <p>请根据拒绝原因修改文件后重新提交审核。</p>
            <a href="http://localhost:5173/files" class="btn">查看文件列表</a>
          </div>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>© ${new Date().getFullYear()} ProtoHub. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'ProtoHub - 审核未通过',
    html,
    text: `您的 Proto 文件 ${fileName} 未通过审核，原因：${reason}`,
  });
}

/**
 * 发送新审核请求邮件（给审核员）
 */
export async function sendNewReviewRequestEmail(
  reviewerEmail: string,
  reviewerName: string,
  submitterName: string,
  fileName: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #52c41a; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          h1 { margin: 0 0 20px 0; }
          .info { background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .btn { display: inline-block; padding: 10px 20px; background: #1890ff; color: white;
                   text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ProtoHub - 新的审核请求</h1>
          </div>
          <div class="content">
            <p>尊敬的 ${reviewerName}：</p>
            <p>用户 <strong>${submitterName}</strong> 提交了新的 Proto 文件审核请求。</p>
            <div class="info">
              <p><strong>文件名：</strong> ${fileName}</p>
              <p><strong>提交时间：</strong> ${new Date().toLocaleString('zh-CN')}</p>
            </div>
            <a href="http://localhost:5173/reviews" class="btn">前往审核工作台</a>
          </div>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>© ${new Date().getFullYear()} ProtoHub. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: reviewerEmail,
    subject: 'ProtoHub - 新的审核请求',
    html,
    text: `${submitterName} 提交了新的 Proto 文件审核请求，文件名：${fileName}`,
  });
}

/**
 * 检查邮件配置
 */
export function checkEmailConfig(): boolean {
  // 简单检查：如果配置不完整，返回 false
  if (!emailConfig.auth.user || !emailConfig.host) {
    return false;
  }
  return true;
}
