# GitHub Actions 自动构建指南

## 设置步骤

### 1. 创建 Personal Access Token
1. 访问 GitHub Settings > Developer settings > Personal access tokens
2. 创建新 token，勾选 `repo` 权限
3. 复制 token，添加到仓库的 Secrets 中，命名为 `GH_TOKEN`

### 2. 代码签名（可选）
如果你需要对 macOS 应用进行代码签名，需要：
1. 准备 Apple Developer 证书
2. 将证书导出为 .p12 文件
3. 将证书内容添加到仓库 Secrets：
   - `CSC_LINK`: 证书的 base64 编码内容
   - `CSC_KEY_PASSWORD`: 证书密码

### 3. 触发构建
有两种方式触发自动构建：

#### 方式一：通过 Git 标签（推荐）
```bash
# 创建并推送标签
git tag v1.0.0
git push origin v1.0.0
```

#### 方式二：手动触发
1. 进入 GitHub 仓库的 Actions 页面
2. 选择 "Build and Release" 工作流
3. 点击 "Run workflow"

### 4. 下载构建产物
构建完成后，你可以：
1. 在 Actions 页面下载构建产物
2. 如果是标签触发，会自动创建 Release，包含所有平台的安装包

## 构建产物说明

- **macOS**: `.dmg` 安装包
- **Windows**: `.exe` 安装程序
- **Linux**: `.AppImage` 或 `.deb` 包（取决于配置）

## 注意事项

1. 首次构建可能需要较长时间，因为需要下载 Electron 二进制文件
2. 确保 `package.json` 中的 `build` 配置正确
3. 如果构建失败，检查 Actions 日志获取详细错误信息
4. 免费账户的 Actions 有使用时间限制