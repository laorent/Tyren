# Tyren AI Assistant

Tyren 是一个**高性能**的 AI 对话助手，基于 **Next.js 15 (App Router)**、**React 19** 和 **Google Gemini API** 构建。项目默认使用 `gemini-2.5-flash`，并提供流式对话、联网搜索、图片输入、思考模式和 PWA 支持。

## 🚀 核心功能

### 🧠 深度思考模式 (Thinking Mode)
- **思考内容实时流**: 开启“深度思考”开关后，后端将调用指定的思考模型，并在模型返回 `thought` 内容时实时展示。
- **折叠式 UI**: 推理过程默认以精致的折叠块呈现，支持随时展开复核 AI 的逻辑。
- **动态模型切换**: 可通过环境变量为“思考模式”配置专门模型，推荐 `gemini-3.1-flash`；未配置时后端会回退到 `GEMINI_MODEL` 或 `gemini-2.5-flash`。
- **重新生成回答**: 当请求失败或对最后一条回答不满意时，可点击“重新生成”按钮，用同一条用户消息重新生成回答。

### 🎨 现代极简主义设计
- **卡片式代码块**: 采用类 ChatGPT 的极简视觉风格，支持 **代码高亮、行号显示、一键复制与一键下载**。
- **PWA 支持**:
  - **定制 3D 资产**: 具备高度视觉冲击力的立构几何 PWA 图标。
  - **强制更新机制**: 内置 Service Worker 强推更新逻辑，确保用户始终运行最新版本。
- **Hydration 优化**: 彻底消除水合警告，首屏秒开，支持智能主题（亮色/暗色）无缝切换。

### 🛡️ 工业级安全与隐私
- **SHA-256 哈希授权**: 采用基于 `WEB_ACCESS_PASSWORD` 派生密钥的哈希 Token 签发机制（有效期 24 小时），配合延迟防御抵御时序攻击，杜绝常规越权。
- **服务端强校验**: 全链路异步 Token 验证，确保 API 安全性。
- **零阻塞本地存储**: 使用 **IndexedDB** 持久化聊天历史，避免 localStorage 的 5MB 限制与主线程阻塞问题。当前实现会保留上传图片数据，以便刷新后恢复完整会话。

### 🌐 联网与渲染优化
- **Google 搜索集成**: 深度集成 Grounding 联网搜索，显示精准的来源信息与引用链接。
- **高性能渲染**: 针对流式传输优化的 Markdown 引擎，支持 **KaTeX 数学公式、GitHub 表格、GFM 规范**。内置独立 `ErrorBoundary` 容错机制，降低渲染异常导致页面崩溃的风险。
- **SSE 缓冲解析**: 前端对流式响应做缓冲与节流更新，减少跨 chunk 解析问题和频繁重渲染。

---

## ⚒️ 快速部署 (Vercel)

聊天接口使用 Edge Runtime，项目可部署到 Vercel，只需以下三步：

1. **Fork** 仓库并导入 Vercel。
2. 在 Vercel Dashboard 中配置以下环境变量：

| 变量名 | 必填 | 描述 | 示例值 |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | ✅ | [Google AI Studio](https://aistudio.google.com/) 获取 | `AIza...` |
| `WEB_ACCESS_PASSWORD` | ✅ | 网页访问密码（后台会自动加盐哈希） | `建议12位以上` |
| `GEMINI_MODEL` | ❌ | 常规对话使用的模型 | `gemini-2.5-flash` |
| `GEMINI_THINKING_MODEL` | ❌ | 思考模式使用的模型；未配置时回退到 `GEMINI_MODEL` | `gemini-3.1-flash` |

3. **Deploy**！访问你的自定义域名即可开始对话。

---

## 💻 本地开发指南

```bash
# 1. 复制示例环境配置
cp .env.example .env

# 2. 安装项目依赖
npm install

# 3. 开启开发服务器
npm run dev
```

---

## 📱 PWA 安装说明

1. **iOS (Safari)**: 点击底部 "分享" 按钮 -> "添加到主屏幕"。
2. **Android (Chrome)**: 点击右上角菜单 -> "添加到主屏幕"。
3. **PC (Chrome/Edge)**: 点击地址栏右侧的安装图标。

---
*Built with passion using Next.js 15, React 19, & Google Gemini.*
