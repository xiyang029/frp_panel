# GitHub 工作流说明

本文说明 `.github/workflows/` 下 GitHub Actions 工作流的触发条件、主要动作和依赖凭据。

## 工作流总览

| 文件 | 名称 | 触发方式 | 作用 |
| --- | --- | --- | --- |
| `.github/workflows/stale.yml` | Close stale issues and PRs | 每天定时、手动触发 | 标记并关闭长期无活动的 Issue 和 PR |
| `.github/workflows/golangci-lint.yml` | golangci-lint | 推送到 `master`、`dev`，以及 PR | 构建 Web 资源后运行 Go lint |
| `.github/workflows/goreleaser.yml` | goreleaser | 手动触发 | 构建 Web 资源、打包并创建 GitHub Release |
| `.github/workflows/build-and-push-image.yml` | Build Image and Publish to Dockerhub & GPR | Release 发布、手动触发 | 构建并推送 frpc/frps 多架构 Docker 镜像 |

## stale.yml

该工作流用于自动处理长期无活动的 Issue 和 PR。

- 触发条件：每天 `00:20 UTC` 定时执行，也支持手动触发。
- 核心动作：使用 `actions/stale@v10`。
- 标记策略：14 天无活动后添加 `lifecycle/stale` 标签。
- 关闭策略：添加 stale 标签后再 3 天无活动则关闭。
- 豁免条件：带有 `bug`、`doc`、`enhancement`、`future`、`proposal`、`question`、`testing`、`todo`、`easy`、`help wanted`、`assigned` 等标签的 Issue/PR 不处理。
- PR 额外豁免：有 milestone 或 assignee 的 PR 不处理。
- 手动参数：`debug-only` 可用于只调试不实际修改。

## golangci-lint.yml

该工作流用于 PR 和主干分支上的 Go 代码质量检查。

- 触发条件：推送到 `master`、`dev`，以及所有 PR。
- 环境：Go `1.25`，Node.js `22`。
- 前置动作：分别在 `web/frps` 和 `web/frpc` 执行 `make build`，确保嵌入 Web 资源参与 Go 侧检查。
- 核心动作：使用 `golangci/golangci-lint-action@v9`，运行 `golangci-lint` `v2.11`。
- 权限：读取仓库内容，并读取 PR 信息。

## goreleaser.yml

该工作流用于正式发布制品。

- 触发条件：仅支持手动触发。
- 环境：Go `1.25`，Node.js `22`。
- 构建步骤：先分别构建 `web/frps` 和 `web/frpc` 的 Web 资源。
- 打包步骤：执行 `./package.sh`。
- 发布步骤：使用 `goreleaser/goreleaser-action@v7` 执行 `release --clean --release-notes=./Release.md`。
- 凭据：依赖 `secrets.GPR_TOKEN` 作为 `GITHUB_TOKEN`。

## build-and-push-image.yml

该工作流用于构建并发布 frpc/frps Docker 镜像。

- 触发条件：GitHub Release 发布时自动执行，也支持手动触发。
- 手动参数：`tag` 指定镜像 tag，默认值为 `test`。
- 自动 tag：Release 触发时使用 release ref 名称作为镜像 tag。
- 构建能力：启用 QEMU 和 Docker Buildx，支持多架构构建。
- 目标平台：`linux/amd64`、`linux/arm/v7`、`linux/arm64`、`linux/ppc64le`、`linux/s390x`。
- frpc 镜像：使用 `dockerfiles/Dockerfile-for-frpc`，推送到 `fatedier/frpc:<tag>` 和 `ghcr.io/fatedier/frpc:<tag>`。
- frps 镜像：使用 `dockerfiles/Dockerfile-for-frps`，推送到 `fatedier/frps:<tag>` 和 `ghcr.io/fatedier/frps:<tag>`。
- 凭据：DockerHub 依赖 `DOCKERHUB_USERNAME`、`DOCKERHUB_PASSWORD`；GitHub Container Registry 依赖 `GPR_TOKEN`。

## 其他 `.github` 文件

- `.github/pull_request_template.md`：PR 描述模板。
- `.github/ISSUE_TEMPLATE/bug_report.yaml`：Bug 报告模板。
- `.github/ISSUE_TEMPLATE/feature_request.yaml`：功能请求模板。
- `.github/ISSUE_TEMPLATE/config.yml`：Issue 模板配置。
- `.github/FUNDING.yml`：GitHub Sponsors 或捐助入口配置。
