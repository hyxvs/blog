/**
 * controllers/verificationController.js - 验证码控制器
 * 
 * 【核心功能】
 * - 发送邮箱验证码
 * - 验证邮箱验证码
 * - 清理过期验证码
 * 
 * 【使用场景】
 * - 用户注册时验证邮箱
 * - 用户登录时使用验证码登录
 * - 用户找回密码时验证身份
 */

const pool = require('../config/pool');
const { sendVerificationCode } = require('../utils/email');

/**
 * 生成6位数字验证码
 * 
 * @returns {string} - 6位数字验证码
 */
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 发送验证码
 * 
 * 【请求】POST /api/verification/send
 * 【请求体】{ email, type }
 * 【响应】{ success, message }
 * 
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const sendCode = async (req, res) => {
  try {
    const { email, type = 'register' } = req.body;

    // 参数验证
    if (!email) {
      return res.status(400).json({ error: '邮箱地址不能为空' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }

    // 验证类型
    const validTypes = ['register', 'login', 'reset_password'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: '无效的验证码类型' });
    }

    // 删除该邮箱之前的验证码（防止重复发送）
    await pool.query(
      'DELETE FROM verification_codes WHERE email = $1 AND type = $2',
      [email, type]
    );

    // 生成验证码
    const code = generateCode();
    
    // 设置过期时间（5分钟）
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // 保存到数据库
    await pool.query(
      'INSERT INTO verification_codes (email, code, type, expires_at) VALUES ($1, $2, $3, $4)',
      [email, code, type, expiresAt]
    );

    // 发送邮件
    await sendVerificationCode(email, code, 5);

    res.json({
      success: true,
      message: '验证码已发送，请注意查收'
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({ error: '发送验证码失败，请稍后重试' });
  }
};

/**
 * 验证验证码
 * 
 * 【请求】POST /api/verification/verify
 * 【请求体】{ email, code, type }
 * 【响应】{ success, message }
 * 
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const verifyCode = async (req, res) => {
  try {
    const { email, code, type = 'register' } = req.body;

    // 参数验证
    if (!email || !code) {
      return res.status(400).json({ error: '邮箱和验证码不能为空' });
    }

    // 验证类型
    const validTypes = ['register', 'login', 'reset_password'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: '无效的验证码类型' });
    }

    // 查询验证码
    const result = await pool.query(
      'SELECT * FROM verification_codes WHERE email = $1 AND type = $2 AND code = $3 AND used = false AND expires_at > CURRENT_TIMESTAMP',
      [email, type, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: '验证码无效或已过期' });
    }

    // 标记为已使用
    await pool.query(
      'UPDATE verification_codes SET used = true WHERE id = $1',
      [result.rows[0].id]
    );

    res.json({
      success: true,
      message: '验证码验证成功'
    });
  } catch (error) {
    console.error('Verify verification code error:', error);
    res.status(500).json({ error: '验证失败，请稍后重试' });
  }
};

/**
 * 清理过期验证码（定时任务调用）
 */
const cleanupExpiredCodes = async () => {
  try {
    await pool.query('DELETE FROM verification_codes WHERE expires_at < CURRENT_TIMESTAMP');
    console.log('Expired verification codes cleaned up');
  } catch (error) {
    console.error('Cleanup expired codes error:', error);
  }
};

module.exports = {
  sendCode,
  verifyCode,
  cleanupExpiredCodes,
};