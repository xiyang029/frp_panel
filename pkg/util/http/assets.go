// Copyright 2025 The frp Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package http

import (
	"bytes"
	"io"
	"net/http"
	"time"

	"github.com/gorilla/mux"

	netpkg "github.com/fatedier/frp/pkg/util/net"
)

func RegisterPublicAssetsRoutes(router *mux.Router, assetsFS http.FileSystem) {
	publicRouter := router.NewRoute().Subrouter()
	publicRouter.Handle("/favicon.ico", http.FileServer(assetsFS)).Methods(http.MethodGet)
	publicRouter.PathPrefix("/static/").Handler(
		netpkg.MakeHTTPGzipHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/static/" || r.URL.Path == "/static/index.html" {
				serveSPAIndex(w, r, assetsFS)
				return
			}
			http.StripPrefix("/static/", http.FileServer(assetsFS)).ServeHTTP(w, r)
		})),
	).Methods(http.MethodGet)
	publicRouter.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		serveSPAIndex(w, r, assetsFS)
	})
}

func serveSPAIndex(w http.ResponseWriter, r *http.Request, assetsFS http.FileSystem) {
	file, err := assetsFS.Open("index.html")
	if err != nil {
		http.NotFound(w, nil)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.ServeContent(w, r, "index.html", time.Unix(0, 0), bytes.NewReader(data))
}
