'use client'

import * as React from 'react'
import { DETAIL_FIELDS, type InventoryDetails } from '@/lib/inventory-details'
import { PropertyType, areaUnitLabel } from '@/lib/taxonomy'
import { AdminField, SelectInput, TextInput } from '@/components/admin/form-fields'

/**
 * Property type + the fields that only exist for that type.
 *
 * The field list is read from DETAIL_FIELDS — the same definition that drives
 * validation and the public spec table — so a field added there appears here
 * automatically. Inputs are named `details.<key>` and collected by the server
 * action, which re-validates them against the same spec.
 */
export function InventoryTypeFields({
  defaultType = 'APARTMENT',
  defaultDetails = {},
  defaultAreaUnit = 'SQFT',
}: {
  defaultType?: string
  defaultDetails?: InventoryDetails
  defaultAreaUnit?: string
}) {
  const [type, setType] = React.useState(
    PropertyType.parse(defaultType) ?? 'APARTMENT',
  )

  const fields = DETAIL_FIELDS[type]
  // Area units resolve to their label; free-text suffixes ("years", "%") pass through.
  const unitLabel = (unit?: string) => {
    if (!unit) return undefined
    if (unit === 'inherit') return areaUnitLabel(defaultAreaUnit)
    return areaUnitLabel(unit) || unit
  }

  return (
    <>
      <AdminField
        label="Property type"
        htmlFor="propertyType"
        required
        hint="Changing this swaps the specification fields below."
      >
        <SelectInput
          id="propertyType"
          name="propertyType"
          options={PropertyType.options}
          value={type}
          onChange={(event) =>
            setType(PropertyType.parse(event.target.value) ?? 'APARTMENT')
          }
        />
      </AdminField>

      <div className="rounded border border-maroon-900/10 bg-cream-50 p-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-gold-500">
          {PropertyType.labels[type]} specifications
        </p>
        <p className="mt-1 text-[12px] text-ink-500">
          Leave anything you don’t know blank. Empty fields won’t show on the listing.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const id = `details-${field.key}`
            const name = `details.${field.key}`
            const value = defaultDetails?.[field.key]
            const suffix = field.unit ? unitLabel(field.unit) : undefined

            if (field.type === 'boolean') {
              return (
                <label
                  key={field.key}
                  className="flex cursor-pointer items-center gap-3 rounded border border-maroon-900/10 bg-white px-3.5 py-2.5"
                >
                  <input
                    type="checkbox"
                    name={name}
                    defaultChecked={value === true}
                    className="size-4 accent-[#7A1220]"
                  />
                  <span className="text-[13px] text-ink-900">{field.label}</span>
                </label>
              )
            }

            if (field.type === 'select') {
              return (
                <AdminField key={field.key} label={field.label} htmlFor={id} hint={field.help}>
                  <SelectInput
                    id={id}
                    name={name}
                    options={field.options.options}
                    placeholder="Not specified"
                    defaultValue={typeof value === 'string' ? value : ''}
                  />
                </AdminField>
              )
            }

            return (
              <AdminField
                key={field.key}
                label={suffix ? `${field.label} (${suffix})` : field.label}
                htmlFor={id}
                hint={field.help}
              >
                <TextInput
                  id={id}
                  name={name}
                  inputMode={field.type === 'number' ? 'decimal' : 'text'}
                  defaultValue={value === null || value === undefined ? '' : String(value)}
                />
              </AdminField>
            )
          })}
        </div>
      </div>
    </>
  )
}
