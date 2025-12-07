# 测试账户列表 (Test Accounts)

## 📋 系统账户（预创建）

### 🔴 管理员 (Admin)
- **邮箱**: `admin@hms.com`
- **密码**: `Admin@123`
- **权限**: 全部管理权限 + 审计日志 + 数据库查看

### 🟠 经理 (Manager)
- **邮箱**: `manager@hms.com`
- **密码**: `Manager@123`
- **权限**: 房间类型管理、房间管理、员工管理、值班表管理、报表查看

### 🟡 前台接待 (Receptionist)
- **邮箱**: `receptionist1@hms.com`
- **密码**: `Receptionist@123`
- **邮箱**: `receptionist2@hms.com`
- **密码**: `Receptionist@123`
- **权限**: 办理入住/退房、创建现场预订、查看所有预订、处理付款

### 🟢 客房服务 (Housekeeping)
- **邮箱**: `housekeeping1@hms.com`
- **密码**: `Housekeeping@123`
- **邮箱**: `housekeeping2@hms.com`
- **密码**: `Housekeeping@123`
- **邮箱**: `housekeeping3@hms.com`
- **密码**: `Housekeeping@123`
- **权限**: 查看分配的任务、更新任务状态、提交清洁日志

---

## 👤 客人账户 (Guest/Customer)

**客人账户不会预创建**，客人需要通过注册页面 (`/register`) 自行注册账户。

注册后，客人可以：
- ✅ 查看房间类型和可用性
- ✅ 创建预订
- ✅ 查看自己的预订历史
- ✅ 取消预订
- ✅ 在线支付

---

## 🔐 密码规则

所有系统账户密码格式：`角色名@123`（首字母大写）

- Admin → `Admin@123`
- Manager → `Manager@123`
- Receptionist → `Receptionist@123`
- Housekeeping → `Housekeeping@123`

---

## 📝 使用说明

1. 打开登录页面: `http://localhost:5173/login`
2. 输入上述邮箱和密码
3. 登录后会自动跳转到对应角色的仪表板

**注意**: 客人账户需要通过注册页面创建，不会在数据库初始化时自动创建。

