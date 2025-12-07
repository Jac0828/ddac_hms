# 修复统计数据为0的问题

## 问题原因

数据库缺少新添加的字段（`IsDeleted`, `CreatedBy`, `UpdatedBy` 等），导致查询失败。

## 解决方案

已暂时禁用软删除查询过滤器。现在需要：

1. **重启后端服务器**：
   ```bash
   # 停止当前运行的后端（如果正在运行）
   lsof -ti:5024 | xargs kill -9
   
   # 重新启动后端
   cd HMS.Api
   dotnet run
   ```

2. **验证修复**：
   - 刷新前端页面
   - 检查统计数据是否正常显示
   - 检查浏览器控制台是否有错误

## 后续步骤

一旦数据正常显示，我们需要：

1. 修复迁移快照问题
2. 生成正确的数据库迁移
3. 应用迁移以添加新字段
4. 重新启用软删除查询过滤器

## 临时解决方案说明

已暂时注释掉以下查询过滤器：
- `Room.HasQueryFilter`
- `Booking.HasQueryFilter`
- `Payment.HasQueryFilter`
- `ServiceRequest.HasQueryFilter`
- `HousekeepingTask.HasQueryFilter`
- `RoomType.HasQueryFilter`

这些过滤器会在数据库迁移完成后重新启用。

