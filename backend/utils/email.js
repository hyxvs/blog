/**
 * utils/email.js - 邮件发送工具
 * 
 * 【核心知识点】
 * 
 * 1. nodemailer 邮件库
 *    - Node.js 最流行的邮件发送库
 *    - 支持多种邮件服务（SMTP、Sendmail、Amazon SES等）
 *    - 支持 HTML 邮件和附件
 * 
 * 2. SMTP 配置
 *    - host: SMTP 服务器地址
 *    - port: SMTP 端口（587 用于 TLS，465 用于 SSL）
 *    - secure: 是否使用 SSL
 *    - auth: 邮箱账号和授权码
 * 
 * 3. 邮箱授权码
 *    - 为了安全，不使用邮箱密码直接登录
 *    - 需要在邮箱设置中开启 SMTP 服务并生成授权码
 *    - 不同邮箱的设置方式略有不同
 */

const nodemailer = require('nodemailer');

/**
 * 创建邮件发送器
 * 
 * 【配置说明】
 * - 使用环境变量配置 SMTP 参数
 * - 支持 QQ邮箱、163邮箱、Gmail等主流邮箱服务
 * 
 * 【常用邮箱 SMTP 配置】
 * QQ邮箱: smtp.qq.com, 端口 587
 * 163邮箱: smtp.163.com, 端口 587
 * Gmail: smtp.gmail.com, 端口 587
 * 企业微信邮箱: smtp.exmail.qq.com, 端口 587
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.qq.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * 发送邮件函数
 * 
 * @param {string} to - 收件人邮箱地址
 * @param {string} subject - 邮件主题
 * @param {string} html - 邮件内容（HTML格式）
 * @returns {Promise<Object>} - 邮件发送结果
 */
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || '博客平台'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

/**
 * 发送验证码邮件
 * 
 * @param {string} to - 收件人邮箱
 * @param {string} code - 验证码
 * @param {string} type - 验证码类型（register/login）
 * @param {number} expiresIn - 有效期（分钟）
 * @returns {Promise<Object>} - 邮件发送结果
 */
const sendVerificationCode = async (to, code, type = 'register', expiresIn = 5) => {
  const siteName = process.env.SITE_NAME || '博客平台';
  const siteDesc = process.env.SITE_DESC || '个人创作与思考的角落';
  const contactEmail = process.env.CONTACT_EMAIL || '2933365269@qq.com';
  
  const actionText = type === 'register' ? '注册' : '登录';
  
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${actionText}验证码 - ${siteName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
          background-color: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        .email-container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .email-header {
          background: linear-gradient(135deg, #257162 0%, #1a5a4a 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .email-header h1 {
          color: #ffffff;
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .email-header p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }
        .email-body {
          padding: 40px 35px;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 20px;
        }
        .description {
          font-size: 15px;
          color: #555;
          margin-bottom: 30px;
        }
        .verification-box {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin-bottom: 30px;
          border: 1px solid #e9ecef;
        }
        .verification-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
        }
        .verification-code {
          font-size: 42px;
          font-weight: bold;
          color: #257162;
          letter-spacing: 12px;
          font-family: 'Courier New', monospace;
        }
        .tips-section {
          background: #fafafa;
          border-radius: 8px;
          padding: 20px 25px;
          margin-bottom: 30px;
          border-left: 4px solid #257162;
        }
        .tips-title {
          font-size: 15px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }
        .tips-list {
          list-style: none;
          padding: 0;
        }
        .tips-list li {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
        }
        .tips-list li:last-child {
          margin-bottom: 0;
        }
        .tips-list li::before {
          content: "•";
          color: #257162;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        .email-footer {
          background: #f8f9fa;
          padding: 25px 35px;
          text-align: center;
          border-top: 1px solid #eee;
        }
        .footer-copyright {
          font-size: 13px;
          color: #888;
          margin-bottom: 8px;
        }
        .footer-contact {
          font-size: 12px;
          color: #999;
        }
        .footer-contact a {
          color: #257162;
          text-decoration: none;
        }
        .footer-note {
          font-size: 11px;
          color: #aaa;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>${actionText}验证码</h1>
          <p>请使用下方验证码完成${actionText}</p>
        </div>
        
        <div class="email-body">
          <p class="greeting">您好！</p>
          <p class="description">
            您正在${actionText} <strong>${siteName}</strong> 账号，请使用以下验证码完成${actionText}：
          </p>
          
          <div class="verification-box">
            <p class="verification-label">您的验证码</p>
            <p class="verification-code">${code}</p>
          </div>
          
          <div class="tips-section">
            <p class="tips-title">📋 温馨提示：</p>
            <ul class="tips-list">
              <li>验证码有效期为 ${expiresIn} 分钟，请及时使用</li>
              <li>请勿将验证码告诉他人，以防账号被盗</li>
              <li>如非本人操作，请忽略此邮件</li>
            </ul>
          </div>
        </div>
        
        <div class="email-footer">
          <p class="footer-copyright">© 2025 ${siteName} | ${siteDesc}</p>
          <p class="footer-contact">
            如有疑问，请联系我们：<a href="mailto:${contactEmail}">${contactEmail}</a>
          </p>
          <p class="footer-note">此邮件由系统自动发送，请勿回复</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const subject = type === 'register' ? `${siteName} - 注册验证码` : `${siteName} - 登录验证码`;
  return sendEmail(to, subject, html);
};

module.exports = {
  sendEmail,
  sendVerificationCode,
};