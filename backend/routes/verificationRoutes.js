/**
 * routes/verificationRoutes.js - 验证码路由
 * 
 * 【路由说明】
 * - POST /api/verification/send - 发送验证码
 * - POST /api/verification/verify - 验证验证码
 */

const express = require('express');
const router = express.Router();
const { sendCode, verifyCode } = require('../controllers/verificationController');

/**
 * 发送验证码
 * 
 * @route POST /api/verification/send
 * @desc 向指定邮箱发送验证码
 * @access Public
 */
router.post('/send', sendCode);

/**
 * 验证验证码
 * 
 * @route POST /api/verification/verify
 * @desc 验证邮箱和验证码是否匹配
 * @access Public
 */
router.post('/verify', verifyCode);

module.exports = router;