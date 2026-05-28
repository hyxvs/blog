# Windows 数据库定时备份配置指南

## 概述

本指南介绍如何在 Windows 系统上设置数据库定时备份任务。

## 前提条件

1. PostgreSQL 已安装并正常运行
2. 已创建备份脚本 `backup.ps1` 和恢复脚本 `restore.ps1`
3. PowerShell 执行策略允许运行脚本

## 手动备份

### 方法 1：直接运行脚本

```powershell
# 进入数据库目录
cd "c:\Users\hyx\Desktop\Blog Platform\backend\database"

# 运行备份脚本
.\backup.ps1
```

### 方法 2：使用 PowerShell 命令

```powershell
# 直接执行脚本
powershell -ExecutionPolicy Bypass -File "c:\Users\hyx\Desktop\Blog Platform\backend\database\backup.ps1"
```

## 设置定时备份

### 方法 1：使用 Windows 任务计划程序（推荐）

#### 步骤 1：打开任务计划程序

1. 按 `Win + R` 键
2. 输入 `taskschd.msc`
3. 按回车打开任务计划程序

#### 步骤 2：创建基本任务

1. 在右侧操作面板点击"创建基本任务"
2. 输入任务名称：`Blog Database Backup`
3. 输入描述：`每天凌晨 2 点自动备份博客数据库`
4. 点击"下一步"

#### 步骤 3：设置触发器

1. 选择"每天"
2. 点击"下一步"
3. 设置开始时间：`02:00:00`（凌晨 2 点）
4. 重复间隔：`1` 天
5. 点击"下一步"

#### 步骤 4：设置操作

1. 选择"启动程序"
2. 点击"下一步"
3. 程序或脚本：输入 `powershell.exe`
4. 添加参数（重要）：
   ```
   -ExecutionPolicy Bypass -File "c:\Users\hyx\Desktop\Blog Platform\backend\database\backup.ps1"
   ```
5. 起始于（可选）：
   ```
   c:\Users\hyx\Desktop\Blog Platform\backend\database
   ```
6. 点击"下一步"

#### 步骤 5：完成设置

1. 查看任务摘要
2. 勾选"当单击完成时，打开此任务属性的对话框"
3. 点击"完成"

#### 步骤 6：配置任务属性

1. 在"常规"选项卡：
   - 勾选"不管用户是否登录都要运行"
   - 勾选"不存储密码"
   - 勾选"使用最高权限运行"

2. 在"条件"选项卡：
   - 取消勾选"只有在计算机使用交流电源时才启动此任务"（如果是笔记本）

3. 在"设置"选项卡：
   - 勾选"如果任务失败，按以下频率重新启动"
   - 重新启动间隔：`5` 分钟
   - 重新启动次数：`3` 次

4. 点击"确定"保存设置

#### 步骤 7：测试任务

1. 在任务列表中找到"Blog Database Backup"
2. 右键点击，选择"运行"
3. 检查备份目录是否生成了新的备份文件

### 方法 2：使用 PowerShell 脚本创建任务

创建 `setup-scheduled-task.ps1` 文件：

```powershell
# 设置定时备份任务
$TASK_NAME = "Blog Database Backup"
$SCRIPT_PATH = "c:\Users\hyx\Desktop\Blog Platform\backend\database\backup.ps1"
$EXECUTE_TIME = "02:00"

# 检查任务是否已存在
$EXISTING_TASK = Get-ScheduledTask -TaskName $TASK_NAME -ErrorAction SilentlyContinue

if ($EXISTING_TASK) {
    Write-Host "任务已存在，正在删除..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false
}

# 创建触发器（每天凌晨 2 点）
$TRIGGER = New-ScheduledTaskTrigger -Daily -At $EXECUTE_TIME

# 创建动作（运行 PowerShell 脚本）
$ACTION = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File `"$SCRIPT_PATH`"" `
    -WorkingDirectory "c:\Users\hyx\Desktop\Blog Platform\backend\database"

# 注册任务
Register-ScheduledTask `
    -TaskName $TASK_NAME `
    -Trigger $TRIGGER `
    -Action $ACTION `
    -Description "每天凌晨 2 点自动备份博客数据库" `
    -User "SYSTEM" `
    -RunLevel Highest `
    -Force

Write-Host "✅ 定时备份任务创建成功！" -ForegroundColor Green
Write-Host "任务名称: $TASK_NAME" -ForegroundColor Cyan
Write-Host "执行时间: 每天 $EXECUTE_TIME" -ForegroundColor Cyan
Write-Host ""
Write-Host "查看任务：" -ForegroundColor Gray
Write-Host "taskschd.msc" -ForegroundColor Gray
```

运行脚本：
```powershell
cd "c:\Users\hyx\Desktop\Blog Platform\backend\database"
.\setup-scheduled-task.ps1
```

## 数据恢复

### 方法 1：使用恢复脚本

```powershell
# 进入数据库目录
cd "c:\Users\hyx\Desktop\Blog Platform\backend\database"

# 恢复最新的备份
.\restore.ps1 -BackupFile "blog_system_20240101_020000.sql.gz"

# 或者只提供文件名（自动在 backups 目录查找）
.\restore.ps1 -BackupFile "blog_system_20240101_020000.sql.gz"
```

### 方法 2：手动恢复

```powershell
# 解压备份文件
gunzip blog_system_20240101_020000.sql.gz

# 恢复数据
psql -U postgres -d blog_system < blog_system_20240101_020000.sql
```

## 验证备份

### 检查备份文件

```powershell
# 查看备份目录
Get-ChildItem .\backups | Sort-Object LastWriteTime -Descending | Select-Object -First 10

# 查看备份文件大小
Get-ChildItem .\backups\*.sql.gz | ForEach-Object {
    $SIZE = [math]::Round($_.Length / 1MB, 2)
    Write-Host "$($_.Name) - $SIZE MB"
}
```

### 测试备份文件

```powershell
# 解压备份文件
Expand-Archive -Path ".\backups\blog_system_20240101_020000.sql.gz" -DestinationPath ".\backups\temp" -Force

# 查看备份内容
Get-Content ".\backups\temp\blog_system_20240101_020000.sql" | Select-Object -First 50

# 清理临时文件
Remove-Item ".\backups\temp" -Recurse -Force
```

## 备份管理

### 自动清理旧备份

创建 `cleanup-old-backups.ps1` 文件：

```powershell
# 清理超过 30 天的旧备份
$BACKUP_DIR = ".\backups"
$DAYS_TO_KEEP = 30

Write-Host "正在清理超过 $DAYS_TO_KEEP 天的旧备份..." -ForegroundColor Yellow

# 查找并删除旧备份
Get-ChildItem $BACKUP_DIR -Filter "*.sql.gz" | Where-Object {
    $_.LastWriteTime -lt (Get-Date).AddDays(-$DAYS_TO_KEEP)
} | ForEach-Object {
    Write-Host "删除: $($_.Name) ($($_.LastWriteTime))" -ForegroundColor Gray
    Remove-Item $_.FullName -Force
}

Write-Host "✅ 清理完成！" -ForegroundColor Green
```

### 查看备份历史

```powershell
# 显示最近 10 次备份
Get-ChildItem .\backups -Filter "*.sql.gz" `
    | Sort-Object LastWriteTime -Descending `
    | Select-Object -First 10 `
    | Format-Table Name, Length, LastWriteTime -AutoSize
```

## 常见问题

### 1. PowerShell 执行策略错误

**错误**：
```
无法加载文件 backup.ps1，因为在此系统上禁止运行脚本
```

**解决**：
```powershell
# 临时允许运行脚本
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# 或以管理员身份运行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. PostgreSQL 命令未找到

**错误**：
```
pg_dump : 无法将"pg_dump"项识别为 cmdlet、函数、脚本文件或可运行程序的名称
```

**解决**：
1. 将 PostgreSQL 的 bin 目录添加到系统 PATH
2. 或使用完整路径：
   ```powershell
   & "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" -U postgres -d blog_system
   ```

### 3. 任务计划程序权限问题

**错误**：任务无法执行

**解决**：
1. 确保任务设置为"使用最高权限运行"
2. 确保勾选"不管用户是否登录都要运行"
3. 检查任务历史记录查看错误信息

### 4. 备份文件损坏

**解决**：
1. 定期测试备份文件的完整性
2. 保留多个备份版本
3. 使用压缩验证工具检查文件

## 最佳实践

1. **备份频率**：
   - 开发环境：每天备份
   - 测试环境：每周备份
   - 生产环境：每小时备份

2. **备份保留**：
   - 保留最近 30 天的备份
   - 每周保留一个完整备份
   - 每月保留一个归档备份

3. **备份验证**：
   - 定期测试恢复流程
   - 验证备份文件完整性
   - 检查备份文件大小

4. **异地备份**：
   - 将备份文件复制到云存储
   - 使用加密保护敏感数据
   - 定期测试异地恢复

5. **监控告警**：
   - 设置备份失败告警
   - 监控备份文件大小
   - 记录备份执行日志
