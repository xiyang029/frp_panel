package http

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gorilla/mux"
)

func TestRegisterPublicAssetsRoutes(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "favicon.ico"), []byte("ico"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("index"), 0o600); err != nil {
		t.Fatal(err)
	}

	router := mux.NewRouter()
	RegisterPublicAssetsRoutes(router, http.Dir(dir))

	t.Run("root serves spa index", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("unexpected status: %d", rr.Code)
		}
		if got := rr.Body.String(); got != "index" {
			t.Fatalf("unexpected body: %q", got)
		}
	})

	t.Run("favicon is public", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/favicon.ico", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("unexpected status: %d", rr.Code)
		}
		if got := rr.Body.String(); got != "ico" {
			t.Fatalf("unexpected body: %q", got)
		}
	})

	t.Run("static serves spa index", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/static/", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("unexpected status: %d", rr.Code)
		}
		if got := rr.Body.String(); got != "index" {
			t.Fatalf("unexpected body: %q", got)
		}
	})

	t.Run("static asset is public", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/static/index.html", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("unexpected status: %d", rr.Code)
		}
		if got := rr.Body.String(); got != "index" {
			t.Fatalf("unexpected body: %q", got)
		}
	})
}
