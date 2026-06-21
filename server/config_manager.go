package server

import (
	"fmt"
	"os"
	"os/exec"
	"time"

	"github.com/fatedier/frp/pkg/config"
	"github.com/fatedier/frp/pkg/config/v1/validation"
	"github.com/fatedier/frp/pkg/policy/security"
)

const restartDelayEnv = "FRPS_RESTART_DELAY_MS"

func (svr *Service) ReadConfigFile() (string, error) {
	if svr.configFilePath == "" {
		return "", fmt.Errorf("frps has no config file path")
	}

	content, err := os.ReadFile(svr.configFilePath)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

func (svr *Service) WriteConfigFile(content []byte) error {
	if svr.configFilePath == "" {
		return fmt.Errorf("frps has no config file path")
	}
	if len(content) == 0 {
		return fmt.Errorf("body can't be empty")
	}

	tmpFile := svr.configFilePath + ".dashboard.tmp"
	if err := os.WriteFile(tmpFile, content, 0o600); err != nil {
		return err
	}
	defer os.Remove(tmpFile)

	loaded, _, err := config.LoadServerConfig(tmpFile, true)
	if err != nil {
		return err
	}

	validator := validation.NewConfigValidator(security.NewUnsafeFeatures(nil))
	if _, err := validator.ValidateServerConfig(loaded); err != nil {
		return err
	}

	return os.WriteFile(svr.configFilePath, content, 0o600)
}

func (svr *Service) RestartFromConfigFile() error {
	if svr.configFilePath == "" {
		return fmt.Errorf("frps can only restart when started with a config file")
	}

	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("resolve executable path: %w", err)
	}

	// Delay the replacement process slightly so the current process can finish
	// the HTTP response and release bound ports before the child starts serving.
	cmd := exec.Command(exePath, os.Args[1:]...)
	cmd.Env = append(os.Environ(), restartDelayEnv+"=1200")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("start replacement frps process: %w", err)
	}

	go func() {
		time.Sleep(200 * time.Millisecond)
		_ = svr.Close()
		os.Exit(0)
	}()

	return nil
}
