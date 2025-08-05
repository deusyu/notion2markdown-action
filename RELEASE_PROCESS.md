# GitHub Action 发布流程文档

## 📋 标准发布流程

### **完整步骤**

```bash
# 1. 修改源代码
git add src/
git commit -m "feat/fix: 功能描述"

# 2. 更新版本号
npm version patch  # 自动更新package.json: 1.1.10 → 1.1.11

# 3. 重新构建dist (关键!)
npm run build

# 4. 提交构建文件
git add dist/ -f  # 强制添加，忽略.gitignore
git commit -m "build: 更新构建文件到v1.1.11"

# 5. 推送所有内容
git push origin main
git push origin --tags

# 6. 更新latest标签 (可选)
git tag -f latest HEAD
git push origin latest --force
```

### **⚠️ 重要注意事项**

1. **必须重新构建**：修改 `src/` 后必须运行 `npm run build`
2. **强制添加dist**：由于 `.gitignore` 忽略了 `dist/`，需要使用 `-f` 参数
3. **版本同步**：确保 `package.json`、git tag、`latest` 标签都指向同一版本

## 🔍 版本管理策略

### **三种版本号类型**

| 类型 | 位置 | 作用 | 示例 |
|------|------|------|------|
| **📦 应用版本** | `package.json` | NPM包管理、代码内引用 | `"version": "1.1.10"` |
| **🏷️ 发布版本** | `git tag` | 代码快照标记、GitHub Actions | `v1.1.10`, `v1.1.9` |
| **🔗 别名版本** | `git tag` | 便捷引用、自动更新 | `latest`, `main` |

### **版本更新规则**

```bash
npm version patch  # 1.1.10 → 1.1.11 (Bug修复)
npm version minor  # 1.1.10 → 1.2.0  (新功能)
npm version major  # 1.1.10 → 2.0.0  (破坏性更改)
```

## 🎯 用户使用方式

### **在GitHub Actions中引用**

```yaml
# 固定版本 - 生产环境推荐
- uses: deusyu/notion2markdown-action@v1.1.10

# 浮动版本 - 测试环境
- uses: deusyu/notion2markdown-action@latest

# 开发版本 - 开发环境
- uses: deusyu/notion2markdown-action@main
```

## 🐛 常见问题排查

### **版本显示错误**
- **问题**：GitHub Actions中显示旧版本号
- **原因**：没有重新构建 `dist/` 目录
- **解决**：运行 `npm run build` 并重新提交

### **Action无法使用**
- **问题**：用户使用 `@latest` 时出错
- **原因**：`latest` 标签没有更新
- **解决**：更新 `latest` 标签到最新提交

### **增量同步失效**
- **问题**：每次都重新生成所有文件
- **原因**：时间格式差异导致文件头部变化
- **解决**：确保时间格式固化为UTC格式

## 📚 技术细节

### **构建工具**
- **编译器**：`ncc` - 将Node.js项目打包为单文件
- **构建命令**：`npm run build` → 生成 `dist/index.js`
- **配置文件**：`package.json` 中的 `"build": "ncc build src/index.js -o dist/"`

### **Git配置**
- **主分支**：`main` - 包含源代码和构建文件
- **忽略文件**：`.gitignore` 忽略 `dist/`，但我们强制提交
- **标签策略**：`v{version}` 标记具体版本，`latest` 标记最新版

### **包依赖**
- **运行时**：所有依赖打包到 `dist/index.js`
- **开发时**：`node_modules/` 被 `.gitignore` 忽略
- **版本控制**：只跟踪 `package.json` 和 `package-lock.json`

## 🔄 自动化改进建议

### **未来可考虑的改进**

1. **GitHub Actions自动构建**
   ```yaml
   # .github/workflows/release.yml
   - name: Build and Release
     run: |
       npm run build
       git add dist/ -f
       git commit -m "build: auto-build v${{ version }}"
   ```

2. **发布前检查**
   ```bash
   # 检查dist是否最新
   npm run build
   git diff --exit-code dist/
   ```

3. **版本标签自动化**
   ```bash
   # 自动更新latest
   git tag -f latest HEAD
   git push origin latest --force
   ```

---

**最后更新**：2025-01-08  
**维护者**：deusyu <daniel@deusyu.app>  
**项目**：notion2markdown-action