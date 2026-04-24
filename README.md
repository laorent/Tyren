# Tyren AI Assistant

Tyren 是一个**旗舰级、高性能**的 AI 对话助手，基于 **Next.js 15 (App Router)** 和 **Google Gemini 3 系列**旗舰级模型族构建。采用全新一代驱动，旨在提供超越原生 App 的极致响应速度与逻辑推理能力，是专为生产环境设计的工业级 PWA 解决方案。

## 🚀 核心旗舰功能

### 🧠 深度思考模式 (Thinking Mode)
- **思维链 (CoT) 实时流**: 开启“深度思考”开关后，后端将调用指定的推理模型，实时展示其逻辑推演过程。
- **折叠式 UI**: 推理过程默认以精致的折叠块呈现，支持随时展开复核 AI 的逻辑。
- **动态模型切换**: 在环境变量中为“思考模式”配置专门的推理模型（推荐 `gemini-3.1-flash` 或其后续版本）。

### 🎨 现代极简主义设计
- **卡片式代码块**: 采用类 ChatGPT 的极简视觉风格，支持 **代码高亮、行号显示、一键复制与一键下载**。
- **旗舰级 PWA**: 
  - **定制 3D 资产**: 具备高度视觉冲击力的立构几何 PWA 图标。
  - **强制更新机制**: 内置 Service Worker 强推更新逻辑，确保用户始终运行最新版本。
- **Hydration 优化**: 彻底消除水合警告，首屏秒开，支持智能主题（亮色/暗色）无缝切换。

### 🛡️ 工业级安全与隐私
- **SHA-256 哈希授权**: 采用基于 `WEB_ACCESS_PASSWORD` 加盐的哈希 Token 签发机制（有效期 7 天），配合延迟防御抵御时序攻击，杜绝常规越权。
- **服务端强校验**: 全链路异步 Token 验证，确保 API 安全性。
- **零阻塞本地存储**: 升级为 **IndexedDB** 持久化，彻底突破 localStorage 的 5MB 限制与主线程阻塞瓶颈。自动剥离历史记录中的 Base64 图片，实现海量会话真正的无感极速存取。

### 🌐 联网与渲染优化
- **Google 搜索集成**: 深度集成 Grounding 联网搜索，显示精准的来源信息与引用链接。
- **高性能渲染**: 针对流式传输优化的 Markdown 引擎，完美支持 **KaTeX 数学公式、Github 表格、GFM 规范**。内置独立 `ErrorBoundary` 容错机制，确保残缺的标签不引发崩溃。
- **Buffer 防抖流**: 独创的 SSE 缓冲区算法，即使在弱网环境下也绝不丢字、不卡顿。

---

## ⚒️ 快速部署 (Vercel)

本项目完美适配 Vercel 的 Edge Runtime，只需以下三步：

1. **Fork** 仓库并导入 Vercel。
2. 在 Vercel Dashboard 中配置以下环境变量：

| 变量名 | 必填 | 描述 | 推荐值 |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | ✅ | [Google AI Studio](https://aistudio.google.com/) 获取 | `AIza...` |
| `WEB_ACCESS_PASSWORD` | ✅ | 网页访问密码（后台会自动加盐哈希） | `建议12位以上` |
| `GEMINI_MODEL` | ❌ | 常规对话使用的模型 | `gemini-2.5-flash` |
| `GEMINI_THINKING_MODEL` | ❌ | 特别指定的推理思考模型 | `gemini-3.1-flash` |

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
