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
- Go 代码保持 `gofmt` 结果；Web 代码遵循现有 Vue、TypeScript、Element Plus、Pinia 和 Vite 写法。
- 配置示例、文档和测试样例必须与实际行为一致，不写未实现能力。
- 修改完成时必须给出“变更摘要”和“受影响文件列表”。

## 测试标准

- 仅文档变更：检查目标 Markdown 内容可读、路径引用准确，可运行 `git diff --check -- AGENTS.md docs/项目文件架构.md`。
- Go 逻辑变更：优先运行受影响包的 `go test -tags "$(NOWEB_TAG)" ./...` 子集；跨包行为运行 `make test`。
- CLI、配置、认证、代理、网络协议或兼容性变更：补充或更新对应单元测试，并按风险运行 `make e2e` 或 `make alltest`。
- Web 面板变更：在对应 `web/frpc` 或 `web/frps` 下运行 `npm run type-check`、`npm run build`，必要时运行 `npm run lint`。
- 构建产物变更：运行 `make frpc`、`make frps` 或 `make build`，按触达范围选择。

## 常用命令

### Build

- `make build` - 构建 `frps` 和 `frpc`
- `make frps` - 仅构建服务端二进制
- `make frpc` - 仅构建客户端二进制
- `make all` - 格式化、构建 Web 面板并构建二进制

### Testing

- `make test` - 运行 Go 单元测试
- `make e2e` - 运行端到端测试
- `make e2e-trace` - 以 trace 日志运行端到端测试
- `make alltest` - 运行 vet、单元测试和端到端测试

### Code Quality

- `make fmt` - 运行 `go fmt`
- `make fmt-more` - 运行 `gofumpt`
- `make gci` - 整理 Go import
- `make vet` - 运行 `go vet`
- `golangci-lint run` - 运行 `.golangci.yml` 配置的综合 lint

### Assets

- `make web` - 构建 `frps` 和 `frpc` Web 管理面板

### Cleanup

- `make clean` - 清理二进制、临时兼容性目录和缓存

## Agent Runbooks

运维类流程保存在 `doc/agents/`：

- `doc/agents/release.md` - 发布流程
