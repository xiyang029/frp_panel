New-Item -ItemType Directory -Force bin | Out-Null
$env:CGO_ENABLED="0"

go build -trimpath -ldflags "-s -w" -tags "frps,noweb" -o .\bin\frps.exe .\cmd\frps
go build -trimpath -ldflags "-s -w" -tags "frpc,noweb" -o .\bin\frpc.exe .\cmd\frpc