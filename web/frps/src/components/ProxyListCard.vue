<template>
  <router-link :to="to" style="display: block; text-decoration: none;">
    <n-card size="small" hoverable :style="{ cursor: 'pointer' }">
      <n-space justify="space-between" align="start" wrap>
        <n-space vertical :size="8" :style="{ minWidth: '0' }">
          <n-space align="center" :size="8" wrap>
            <n-text strong>{{ proxy.name }}</n-text>
            <n-tag v-if="showTypeTag" size="small" :bordered="false">
              {{ proxy.type.toUpperCase() }}
            </n-tag>
            <n-tag size="small" :type="proxy.status === 'online' ? 'success' : 'error'" :bordered="false">
              {{ proxy.status }}
            </n-tag>
          </n-space>

          <n-space align="center" :size="16" wrap>
            <div v-if="proxy.port" style="display:inline-flex;align-items:center;gap:4px;">
              <n-icon size="16" depth="3">
                <Server />
              </n-icon>
              <n-text depth="3">
                {{ proxy.port }}
              </n-text>
            </div>
            <div style="display:inline-flex;align-items:center;gap:4px;">
              <n-icon size="16" depth="3">
                <Link />
              </n-icon>
              <n-text depth="3"> {{ proxy.conns }}</n-text>
            </div>
            <div v-if="proxy.clientID" style="display:inline-flex;align-items:center;gap:4px;">
              <n-icon size="16" depth="3">
                <Users />
              </n-icon>
              <n-text depth="3">
                {{ proxy.user ? `${proxy.user}.${proxy.clientID}` : proxy.clientID }}
              </n-text>
            </div>
          </n-space>
        </n-space>

        <n-space vertical align="end" :size="4" :style="{ flexShrink: 0 }">
          <n-text depth="3">↑ {{ formatFileSize(proxy.trafficOut) }}</n-text>
          <n-text depth="3">↓ {{ formatFileSize(proxy.trafficIn) }}</n-text>
        </n-space>
      </n-space>
    </n-card>
  </router-link>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { NCard, NIcon, NSpace, NTag, NText } from 'naive-ui'
import { Link, Server, Users } from '@vicons/tabler'
import { formatFileSize } from '../utils/format'
import type { BaseProxy } from '../utils/proxy'

defineProps<{
  proxy: BaseProxy
  to: RouteLocationRaw
  showTypeTag?: boolean
}>()
</script>
