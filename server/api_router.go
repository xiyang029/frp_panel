// Copyright 2017 fatedier, fatedier@gmail.com
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

package server

import (
	"fmt"
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"

	httppkg "github.com/fatedier/frp/pkg/util/http"
	netpkg "github.com/fatedier/frp/pkg/util/net"
	adminapi "github.com/fatedier/frp/server/http"
)

func (svr *Service) registerRouteHandlers(helper *httppkg.RouterRegisterHelper) {
	helper.Router.HandleFunc("/healthz", healthz)
	apiController := adminapi.NewController(svr.cfg, svr.clientRegistry, svr.pxyManager)

	publicRouter := helper.Router.NewRoute().Subrouter()
	publicRouter.Handle("/favicon.ico", http.FileServer(helper.AssetsFS)).Methods("GET")
	publicRouter.PathPrefix("/static/").Handler(
		netpkg.MakeHTTPGzipHandler(http.StripPrefix("/static/", http.FileServer(helper.AssetsFS))),
	).Methods("GET")
	publicRouter.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/static/", http.StatusMovedPermanently)
	})

	subRouter := helper.Router.NewRoute().Subrouter()
	subRouter.Use(helper.AuthMiddleware)
	subRouter.Use(httppkg.NewRequestLogger)

	// metrics
	if svr.cfg.EnablePrometheus {
		subRouter.Handle("/metrics", promhttp.Handler())
	}

	// apis
	subRouter.HandleFunc("/api/serverinfo", httppkg.MakeHTTPHandlerFunc(apiController.APIServerInfo)).Methods("GET")
	subRouter.HandleFunc("/api/config", httppkg.MakeHTTPHandlerFunc(func(ctx *httppkg.Context) (any, error) {
		return svr.ReadConfigFile()
	})).Methods("GET")
	subRouter.HandleFunc("/api/config", httppkg.MakeHTTPHandlerFunc(func(ctx *httppkg.Context) (any, error) {
		body, err := ctx.Body()
		if err != nil {
			return nil, httppkg.NewError(http.StatusBadRequest, fmt.Sprintf("read request body error: %v", err))
		}
		if err := svr.WriteConfigFile(body); err != nil {
			return nil, httppkg.NewError(http.StatusBadRequest, err.Error())
		}
		if err := svr.RestartFromConfigFile(); err != nil {
			return nil, httppkg.NewError(http.StatusInternalServerError, err.Error())
		}
		return map[string]any{
			"message": "configuration persisted, frps is restarting to apply changes",
		}, nil
	})).Methods("PUT")
	subRouter.HandleFunc("/api/proxy/{type}", httppkg.MakeHTTPHandlerFunc(apiController.APIProxyByType)).Methods("GET")
	subRouter.HandleFunc("/api/proxy/{type}/{name}", httppkg.MakeHTTPHandlerFunc(apiController.APIProxyByTypeAndName)).Methods("GET")
	subRouter.HandleFunc("/api/proxies/{name}", httppkg.MakeHTTPHandlerFunc(apiController.APIProxyByName)).Methods("GET")
	subRouter.HandleFunc("/api/traffic/{name}", httppkg.MakeHTTPHandlerFunc(apiController.APIProxyTraffic)).Methods("GET")
	subRouter.HandleFunc("/api/clients", httppkg.MakeHTTPHandlerFunc(apiController.APIClientList)).Methods("GET")
	subRouter.HandleFunc("/api/clients/{key}", httppkg.MakeHTTPHandlerFunc(apiController.APIClientDetail)).Methods("GET")
	subRouter.HandleFunc("/api/proxies", httppkg.MakeHTTPHandlerFunc(apiController.DeleteProxies)).Methods("DELETE")

	subRouter.HandleFunc("/api/v2/users", httppkg.MakeHTTPHandlerFuncV2(apiController.APIV2UserList)).Methods("GET")
	subRouter.HandleFunc("/api/v2/clients", httppkg.MakeHTTPHandlerFuncV2(apiController.APIV2ClientList)).Methods("GET")
	subRouter.HandleFunc("/api/v2/clients/{key}", httppkg.MakeHTTPHandlerFuncV2(apiController.APIV2ClientDetail)).Methods("GET")
	subRouter.HandleFunc("/api/v2/proxies", httppkg.MakeHTTPHandlerFuncV2(apiController.APIV2ProxyList)).Methods("GET")
	subRouter.HandleFunc("/api/v2/proxies/{name}", httppkg.MakeHTTPHandlerFuncV2(apiController.APIV2ProxyDetail)).Methods("GET")
}

func healthz(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(200)
}
