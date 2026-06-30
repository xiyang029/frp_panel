# AGENTS.md

## 项目基本介绍

本项目是 `github.com/fatedier/frp`，一个用于内网穿透的高性能反向代理系统。核心由 Go 编写，包含服务端 `frps`、客户端 `frpc`、配置解析、认证、代理转发、NAT 穿透、插件、指标、HTTP API、Web 管理面板和端到端测试。

需要了解目录与文件职责时，先读取 `docs/项目文件架构.md`。该文件维护项目级文件结构说明，避免在任务中反复全量扫描仓库。

## 执行约束

- 仅做与当前需求直接相关的手术式局部修改，禁止无关重构、格式化风暴和依赖 churn。
- 不得覆盖或回退用户已有变更；发现无关脏文件时忽略，发现相关冲突时先说明影响。
- 代码文件不得新增头部元数据、版权模板或无关生成标记。
- 新增或修改变量、方法、类型、配置字段时，需用功能性命名；必要注释说明用途、边界或非显然行为，避免重复代码字面含义。
- 优先复用现有目录、包边界、命名风格和错误处理方式。
- Go 代码保持 `gofmt` 结果；Web 代码遵循现有 React、TypeScript、Tailwind CSS v4、shadcn/ui、Zustand 和 Vite 写法。
- Web UI 使用 shadcn/ui 时，初始化与组件添加必须通过 `pnpm dlx shadcn@latest init` / `pnpm dlx shadcn@latest add` 执行；不得手写 `components.json`、Tailwind/shadcn 生成配置或手动拷贝 registry 组件源码。
- 配置示例、文档和测试样例必须与实际行为一致，不写未实现能力。
- 修改完成时必须给出“变更摘要”和“受影响文件列表”。

## 测试标准

- 仅文档变更：检查目标 Markdown 内容可读、路径引用准确，可运行 `git diff --check -- AGENTS.md docs/项目文件架构.md`。
- Go 逻辑变更：优先运行受影响包的 `go test ./...` 子集；跨包行为扩大到相关目录或全量 `go test ./...`。
- CLI、配置、认证、代理、网络协议或兼容性变更：补充或更新对应单元测试；如需端到端验证，按当前仓库实际测试入口执行，不引用已删除的 `make` 或 `hack/*.sh` 流程。
- Web 面板变更：优先在 `web` 下运行 `pnpm --filter frpc-dashboard type-check`、`pnpm --filter frps-dashboard type-check` 和对应 `build`，必要时运行对应 `lint`。
- 构建产物变更：按触达范围运行 `go build -tags "frps" ./cmd/frps`、`go build -tags "frpc" ./cmd/frpc`，Web 资源按需执行 `npm run build`。

## 常用命令

### Build

- `go build -tags "frps" ./cmd/frps` - 仅构建服务端二进制
- `go build -tags "frpc" ./cmd/frpc` - 仅构建客户端二进制
- `powershell -File .\dev.ps1` - 启动本地开发联调环境
- `package.bat` - 构建 Web 资源并打包 Windows/Linux amd64 发布产物

### Testing

- `go test ./...` - 运行 Go 单元测试
- `run-lint-tsc.bat` - 运行 `web/frps` 与 `web/frpc` 的 lint 和 type-check

### Code Quality

- `go fmt ./...` - 运行 Go 格式化
- `go vet ./...` - 运行 Go vet
- `pnpm --filter frps-dashboard lint` / `pnpm --filter frpc-dashboard lint` - 运行对应 Web 面板 ESLint

### Assets

- `pnpm --dir .\web --filter frps-dashboard build` - 构建 `frps` Web 管理面板
- `pnpm --dir .\web --filter frpc-dashboard build` - 构建 `frpc` Web 管理面板

### Cleanup

- 手动清理 `bin/`、`release/`、`web/*/dist/`、`.cache/dev/` 等本地产物目录
