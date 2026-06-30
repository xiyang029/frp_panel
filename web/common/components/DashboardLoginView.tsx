import { FormEvent, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { setDashboardAuth, type DashboardAuth, verifyDashboardAuth } from '@common/utils/auth'

export interface DashboardLoginViewProps {
  title: string
  storageKey: string
  probePath: string
  embedded?: boolean
  onSuccess?: () => void
}

export function DashboardLoginView({
  title,
  storageKey,
  probePath,
  embedded = false,
  onSuccess,
}: DashboardLoginViewProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<DashboardAuth>({ username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const nextPath = useMemo(() => {
    const raw = searchParams.get('next')
    return raw ? decodeURIComponent(raw) : '/'
  }, [searchParams])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.username || !form.password) {
      toast.error('请输入用户名和密码')
      return
    }

    setSubmitting(true)
    try {
      const authOk = await verifyDashboardAuth(probePath, form)
      if (!authOk) {
        toast.error('用户名或密码错误')
        return
      }

      setDashboardAuth(storageKey, form)
      toast.success('登录成功 ')

      if (onSuccess) {
        onSuccess()
      } else {
        navigate(nextPath, { replace: true })
      }
    } catch (err: any) {
      toast.error('登录验证失败：' + (err.message || '未知错误'))
    } finally {
      setSubmitting(false)
    }
  }

  const content = (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="dashboard-username">用户名</FieldLabel>
          <Input
            id="dashboard-username"
            value={form.username}
            autoComplete="username"
            onChange={(event) => setForm((value) => ({ ...value, username: event.target.value }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="dashboard-password">密码</FieldLabel>
          <Input
            id="dashboard-password"
            type="password"
            value={form.password}
            autoComplete="current-password"
            onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
          />
        </Field>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Spinner data-icon="inline-start" /> : null}
          登录
        </Button>
      </FieldGroup>
    </form>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="grid h-full place-items-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    </div>
  )
}
