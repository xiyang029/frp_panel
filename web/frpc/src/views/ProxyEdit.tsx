import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeftIcon, SaveIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LoadingState, PageHeader, PageSection } from '@common/components/Page'
import { getStoreProxy } from '../api/frpc'
import ProxyFormLayout, { isProxyFormValid } from '../components/proxy-form/ProxyFormLayout'
import { useProxyStore } from '../stores/proxy'
import { createDefaultProxyForm, formToStoreProxy, storeProxyToForm, type ProxyFormData } from '../types'

export default function ProxyEdit() {
  const { name } = useParams()
  const navigate = useNavigate()
  const isEditing = !!name
  const proxyStore = useProxyStore()
  const [form, setForm] = useState<ProxyFormData>(() => createDefaultProxyForm())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const canSave = isProxyFormValid(form)

  useEffect(() => {
    if (!name) return
    const load = async () => {
      setLoading(true)
      try {
        const config = await getStoreProxy(decodeURIComponent(name))
        setForm(storeProxyToForm(config))
      } catch (err: any) {
        toast.error('加载代理失败：' + (err.message || '未知错误'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [name])

  const handleSave = async () => {
    if (!canSave) {
      toast.error('请先填写必填项')
      return
    }
    setSaving(true)
    try {
      const payload = formToStoreProxy(form)
      if (isEditing && name) {
        await proxyStore.updateProxy(decodeURIComponent(name), payload)
      } else {
        await proxyStore.createProxy(payload)
      }
      toast.success('代理已保存')
      navigate('/proxies?tab=store')
    } catch (err: any) {
      toast.error('保存失败：' + (err.message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState />

  return (
    <PageSection>
      <PageHeader
        title={isEditing ? '编辑代理' : '新建代理'}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/proxies?tab=store')}>
              <ArrowLeftIcon data-icon="inline-start" />
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || !canSave}>
              {saving ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              保存
            </Button>
          </>
        }
      />
      <ProxyFormLayout value={form} onChange={setForm} editing={isEditing} />
    </PageSection>
  )
}
