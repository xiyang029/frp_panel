import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export interface SelectOption {
  label: string
  value: string
}

function labelWithRequiredMark(label: string, required?: boolean) {
  return (
    <>
      {label}
      {required ? (
        <span aria-hidden="true" className="text-destructive">
          {' '}
          *
        </span>
      ) : null}
    </>
  )
}

export function TextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  type?: string
  required?: boolean
}) {
  return (
    <Field data-disabled={disabled || undefined}>
      <FieldLabel>{labelWithRequiredMark(label, required)}</FieldLabel>
      <Input
        value={value}
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        aria-required={required || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  disabled,
  min,
  max,
  required,
}: {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  disabled?: boolean
  min?: number
  max?: number
  required?: boolean
}) {
  return (
    <Field data-disabled={disabled || undefined}>
      <FieldLabel>{labelWithRequiredMark(label, required)}</FieldLabel>
      <Input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        aria-required={required || undefined}
        onChange={(event) => {
          const next = event.target.value
          onChange(next === '' ? undefined : Number(next))
        }}
      />
    </Field>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  disabled?: boolean
  required?: boolean
}) {
  return (
    <Field data-disabled={disabled || undefined}>
      <FieldLabel>{labelWithRequiredMark(label, required)}</FieldLabel>
      <Select
        value={value || '__empty'}
        onValueChange={(next) => onChange(next === '__empty' ? '' : next)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full" aria-required={required || undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value || '__empty'} value={option.value || '__empty'}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

export function SwitchField({
  label,
  checked,
  onChange,
  disabled,
  required,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  required?: boolean
}) {
  return (
    <Field orientation="horizontal" data-disabled={disabled || undefined}>
      <FieldLabel>{labelWithRequiredMark(label, required)}</FieldLabel>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </Field>
  )
}

export function StringListField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  placeholder?: string
}) {
  const update = (index: number, next: string) => {
    const copy = [...value]
    copy[index] = next
    onChange(copy)
  }

  return (
    <Field data-disabled={disabled || undefined}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-2">
        {value.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input value={item} disabled={disabled} placeholder={placeholder} onChange={(event) => update(index, event.target.value)} />
            {!disabled ? (
              <Button variant="outline" size="icon" onClick={() => onChange(value.filter((_, i) => i !== index))}>
                <Trash2Icon />
              </Button>
            ) : null}
          </div>
        ))}
        {!disabled ? (
          <Button variant="outline" type="button" onClick={() => onChange([...value, ''])}>
            <PlusIcon data-icon="inline-start" />
            添加
          </Button>
        ) : null}
      </div>
    </Field>
  )
}

export function KeyValueListField({
  label,
  value,
  onChange,
  disabled,
  keyPlaceholder = '键',
  valuePlaceholder = '值',
}: {
  label: string
  value: Array<{ key: string; value: string }>
  onChange: (value: Array<{ key: string; value: string }>) => void
  disabled?: boolean
  keyPlaceholder?: string
  valuePlaceholder?: string
}) {
  const update = (index: number, field: 'key' | 'value', next: string) => {
    const copy = [...value]
    copy[index] = { ...copy[index], [field]: next }
    onChange(copy)
  }

  return (
    <Field data-disabled={disabled || undefined}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-2">
        {value.map((item, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <Input value={item.key} disabled={disabled} placeholder={keyPlaceholder} onChange={(event) => update(index, 'key', event.target.value)} />
            <Input value={item.value} disabled={disabled} placeholder={valuePlaceholder} onChange={(event) => update(index, 'value', event.target.value)} />
            {!disabled ? (
              <Button variant="outline" size="icon" onClick={() => onChange(value.filter((_, i) => i !== index))}>
                <Trash2Icon />
              </Button>
            ) : null}
          </div>
        ))}
        {!disabled ? (
          <Button variant="outline" type="button" onClick={() => onChange([...value, { key: '', value: '' }])}>
            <PlusIcon data-icon="inline-start" />
            添加
          </Button>
        ) : null}
      </div>
    </Field>
  )
}
