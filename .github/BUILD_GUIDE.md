# GitHub Actions 自动构建指南

## 设置步骤

### 1. 创建 Personal Access Token
1. 访问 GitHub Settings > Developer settings > Personal access tokens
2. 点击 "Generate new token (classic)"
3. 设置 token 名称，如 "K-Line-Waker Release Token"
4. 选择过期时间（建议选择较长时间，如 1 年）
5. 勾选以下权限：
   - `repo` - 完整的仓库访问权限
   - `workflow` - 更新和运行 GitHub Actions 工作流
6. 复制 token，添加到仓库的 Secrets 中，命名为 `GH_TOKEN`

> **重要**: 确保勾选了 `repo` 权限，这是创建 Release 所必需的。

### 2. 验证 Token 权限
创建 token 后，你可以通过以下方式验证权限：
1. 访问 GitHub API: https://api.github.com/user/repos
2. 如果提示输入用户名和密码，输入你的 GitHub 用户名和刚创建的 token
3. 如果能看到你的仓库列表，说明 token 权限正确

### 3. 替代方案：使用 GITHUB_TOKEN
如果 Personal Access Token 仍有问题，可以尝试使用默认的 GITHUB_TOKEN，但需要修改工作流权限：

1. 在仓库设置中，进入 Actions > General
2. 找到 "Workflow permissions" 部分
3. 选择 "Read and write permissions"
4. 勾选 "Allow GitHub Actions to create and approve pull requests"

然后修改工作流文件，使用 GITHUB_TOKEN：

```yaml
- name: Create Release
  uses: softprops/action-gh-release@v1
  with:
    files: artifacts/**/*
    draft: false
    prerelease: false
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 4. 代码签名（可选）
如果你需要对 macOS 应用进行代码签名，需要：
1. 准备 Apple Developer 证书
2. 将证书导出为 .p12 文件
3. 将证书内容添加到仓库 Secrets：
   - `CSC_LINK`: 证书的 base64 编码内容
   - `CSC_KEY_PASSWORD`: 证书密码

> **注意**: 当前构建配置已禁用代码签名，使用 `--publish=never` 参数。这样可以避免签名相关的错误。

### 5. 触发构建
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

### 6. 下载构建产物
构建完成后，你可以：
1. 在 Actions 页面下载构建产物
2. 如果是标签触发，会自动创建 Release，包含所有平台的安装包

## 构建产物说明

- **macOS**: `.dmg` 安装包
- **Windows**: `.exe` 安装程序

## 常见问题

### 1. Release 创建失败 (403 错误)
- 确保 Personal Access Token 包含 `repo` 权限
- 检查 token 是否已正确添加到仓库 Secrets
- 尝试重新生成 token 并更新 Secrets

### 2. macOS 代码签名错误
如果遇到 "empty password will be used for code signing" 错误，说明没有配置代码签名。当前配置已禁用签名，可以正常构建未签名的应用。

### 3. 构建超时
GitHub Actions 免费账户有使用时间限制，如果构建超时，可以：
- 优化构建脚本
- 使用自托管 runner
- 升级到 GitHub Pro

### 4. 依赖安装失败
确保 `package-lock.json` 文件已提交到仓库，这样可以保证依赖版本一致性。

## 注意事项

1. 首次构建可能需要较长时间，因为需要下载 Electron 二进制文件
2. 确保 `package.json` 中的 `build` 配置正确
3. 如果构建失败，检查 Actions 日志获取详细错误信息
4. 免费账户的 Actions 有使用时间限制
5. Personal Access Token 相当于密码，请妥善保管