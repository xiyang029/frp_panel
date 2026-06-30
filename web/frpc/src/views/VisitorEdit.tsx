import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeftIcon, SaveIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LoadingState, PageHeader, PageSection } from '@common/components/Page'
import { getStoreVisitor } from '../api/frpc'
import VisitorFormLayout, { isVisitorFormValid } from '../components/visitor-form/VisitorFormLayout'
import { useVisitorStore } from '../stores/visitor'
import { createDefaultVisitorForm, formToStoreVisitor, storeVisitorToForm, type VisitorFormData } from '../types'

export default function VisitorEdit() {
  const { name } = useParams()
  const navigate = useNavigate()
  const isEditing = !!name
  const visitorStore = useVisitorStore()
  const [form, setForm] = useState<VisitorFormData>(() => createDefaultVisitorForm())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const canSave = isVisitorFormValid(form)

  useEffect(() => {
    if (!name) return
    const load = async () => {
      setLoading(true)
      try {
        const config = await getStoreVisitor(decodeURIComponent(name))
        setForm(storeVisitorToForm(config))
      } catch (err: any) {
        toast.error('加载访问器失败：' + (err.message || '未知错误'))
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
      const payload = formToStoreVisitor(form)
      if (isEditing && name) {
        await visitorStore.updateVisitor(decodeURIComponent(name), payload)
      } else {
        await visitorStore.createVisitor(payload)
      }
      toast.success('访问器已保存')
      navigate('/visitors')
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
        title={isEditing ? '编辑访问器' : '新建访问器'}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/visitors')}>
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
      <VisitorFormLayout value={form} onChange={setForm} editing={isEditing} />
    </PageSection>
  )
}
