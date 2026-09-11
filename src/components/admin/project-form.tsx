import type { Image as ImageRow, Project } from '@prisma/client'
import { AreaUnit, ProjectStatus, ProjectType, PropertyLocation } from '@/lib/taxonomy'
import { readConfigurations, readFloorPlans, readStringList } from '@/lib/json'
import {
  AdminField,
  FormSection,
  SelectInput,
  SubmitButton,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/admin/form-fields'
import { ImageManager } from '@/components/admin/image-manager'

type ProjectWithImages = Project & { images: ImageRow[] }

/** Create and edit share this form; `project` is undefined when creating. */
export function ProjectForm({
  project,
  action,
}: {
  project?: ProjectWithImages
  action: (formData: FormData) => Promise<void>
}) {
  const configurations = project ? readConfigurations(project.configurations) : []
  const floorPlans = project ? readFloorPlans(project.floorPlans) : []
  const videoIds = project ? readStringList(project.videoIds) : []

  return (
    <form action={action} className="space-y-6">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      <FormSection title="Basics">
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="Project title" htmlFor="title" required className="sm:col-span-2">
            <TextInput id="title" name="title" defaultValue={project?.title} required />
          </AdminField>

          <AdminField
            label="URL slug"
            htmlFor="slug"
            hint="Leave blank to generate from the title. Changing it changes the public URL."
          >
            <TextInput id="slug" name="slug" defaultValue={project?.slug} placeholder="auto" />
          </AdminField>

          <AdminField label="Developer" htmlFor="developer" required>
            <TextInput id="developer" name="developer" defaultValue={project?.developer} required />
          </AdminField>

          <AdminField label="Project type" htmlFor="projectType">
            <SelectInput
              id="projectType"
              name="projectType"
              options={ProjectType.options}
              defaultValue={project?.projectType ?? 'RESIDENTIAL_APARTMENT'}
            />
          </AdminField>

          <AdminField
            label="Status"
            htmlFor="status"
            hint="Setting this to Pre-Launch moves the project to /pre-launch."
          >
            <SelectInput
              id="status"
              name="status"
              options={ProjectStatus.options}
              defaultValue={project?.status ?? 'NEW_LAUNCH'}
            />
          </AdminField>

          <AdminField label="Location" htmlFor="location">
            <SelectInput
              id="location"
              name="location"
              options={PropertyLocation.options}
              defaultValue={project?.location ?? 'NOIDA'}
            />
          </AdminField>

          <AdminField label="Sector" htmlFor="sector">
            <TextInput id="sector" name="sector" defaultValue={project?.sector ?? ''} placeholder="Sector 150" />
          </AdminField>

          <AdminField label="Full address" htmlFor="address" className="sm:col-span-2">
            <TextInput id="address" name="address" defaultValue={project?.address ?? ''} />
          </AdminField>
        </div>
      </FormSection>

      <FormSection title="Pricing & size" description="Amounts in rupees, e.g. 12500000 for ₹1.25 Cr.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AdminField label="Price from (₹)" htmlFor="priceMin">
            <TextInput id="priceMin" name="priceMin" inputMode="numeric" defaultValue={project?.priceMin ?? ''} />
          </AdminField>
          <AdminField label="Price to (₹)" htmlFor="priceMax">
            <TextInput id="priceMax" name="priceMax" inputMode="numeric" defaultValue={project?.priceMax ?? ''} />
          </AdminField>
          <AdminField label="Area from" htmlFor="areaMin">
            <TextInput id="areaMin" name="areaMin" inputMode="numeric" defaultValue={project?.areaMin ?? ''} />
          </AdminField>
          <AdminField label="Area to" htmlFor="areaMax">
            <TextInput id="areaMax" name="areaMax" inputMode="numeric" defaultValue={project?.areaMax ?? ''} />
          </AdminField>
          <AdminField label="Area unit" htmlFor="areaUnit">
            <SelectInput
              id="areaUnit"
              name="areaUnit"
              options={AreaUnit.options}
              defaultValue={project?.areaUnit ?? 'SQFT'}
            />
          </AdminField>
          <AdminField label="Possession date" htmlFor="possessionDate">
            <TextInput
              id="possessionDate"
              name="possessionDate"
              type="date"
              defaultValue={project?.possessionDate?.toISOString().slice(0, 10) ?? ''}
            />
          </AdminField>
          <AdminField label="RERA number" htmlFor="reraNumber" className="sm:col-span-2">
            <TextInput id="reraNumber" name="reraNumber" defaultValue={project?.reraNumber ?? ''} />
          </AdminField>
        </div>
      </FormSection>

      <FormSection
        title="Pre-launch"
        description="Only used when the status is Pre-Launch. Gating hides pricing, floor plans and the brochure until a visitor verifies their phone number."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="Expected launch" htmlFor="expectedLaunch" hint="e.g. Q1 2027">
            <TextInput id="expectedLaunch" name="expectedLaunch" defaultValue={project?.expectedLaunch ?? ''} />
          </AdminField>
          <AdminField label="Starting price (₹)" htmlFor="startingPrice">
            <TextInput
              id="startingPrice"
              name="startingPrice"
              inputMode="numeric"
              defaultValue={project?.startingPrice ?? ''}
            />
          </AdminField>
          <AdminField label="Early-bird note" htmlFor="earlyBirdNote" className="sm:col-span-2">
            <TextArea id="earlyBirdNote" name="earlyBirdNote" rows={2} defaultValue={project?.earlyBirdNote ?? ''} />
          </AdminField>
        </div>
        <Toggle
          name="isGated"
          label="Gate the full details"
          hint="Visitors see a teaser until they submit an OTP-verified enquiry."
          defaultChecked={project?.isGated ?? false}
        />
      </FormSection>

      <FormSection title="Content">
        <AdminField
          label="Description"
          htmlFor="description"
          hint="Basic HTML is allowed. Wrap each paragraph in <p> tags."
        >
          <TextArea id="description" name="description" rows={8} defaultValue={project?.description ?? ''} />
        </AdminField>

        <AdminField label="Highlights" htmlFor="highlights" hint="One per line.">
          <TextArea
            id="highlights"
            name="highlights"
            rows={5}
            defaultValue={project ? readStringList(project.highlights).join('\n') : ''}
          />
        </AdminField>

        <AdminField label="Amenities" htmlFor="amenities" hint="One per line. Icons are matched automatically.">
          <TextArea
            id="amenities"
            name="amenities"
            rows={6}
            defaultValue={project ? readStringList(project.amenities).join('\n') : ''}
          />
        </AdminField>

        <AdminField
          label="Configurations"
          htmlFor="configurations"
          hint='JSON array: [{"type":"3 BHK","area":1640,"areaUnit":"SQFT","price":12400000}]'
        >
          <TextArea
            id="configurations"
            name="configurations"
            rows={5}
            className="font-mono text-[12px]"
            defaultValue={JSON.stringify(configurations, null, 2)}
          />
        </AdminField>

        <AdminField
          label="Floor plans"
          htmlFor="floorPlans"
          hint='JSON array: [{"title":"3 BHK, 1,640 sq.ft.","imageUrl":"/uploads/plan.jpg"}]'
        >
          <TextArea
            id="floorPlans"
            name="floorPlans"
            rows={4}
            className="font-mono text-[12px]"
            defaultValue={JSON.stringify(floorPlans, null, 2)}
          />
        </AdminField>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="YouTube video IDs" htmlFor="videoIds" hint="One per line or comma separated.">
            <TextArea id="videoIds" name="videoIds" rows={2} defaultValue={videoIds.join('\n')} />
          </AdminField>
          <AdminField label="Brochure URL" htmlFor="brochureUrl" hint="Upload the PDF, then paste its /uploads/… path.">
            <TextInput id="brochureUrl" name="brochureUrl" defaultValue={project?.brochureUrl ?? ''} />
          </AdminField>
          <AdminField
            label="Map embed URL"
            htmlFor="mapEmbedUrl"
            className="sm:col-span-2"
            hint="Google Maps → Share → Embed a map, or https://www.google.com/maps?q=SECTOR&output=embed"
          >
            <TextInput id="mapEmbedUrl" name="mapEmbedUrl" defaultValue={project?.mapEmbedUrl ?? ''} />
          </AdminField>
        </div>
      </FormSection>

      <FormSection title="Images" description="Drag to reorder. The starred image is used on cards and for sharing.">
        <ImageManager
          initial={(project?.images ?? []).map((image) => ({
            url: image.url,
            alt: image.alt,
            isPrimary: image.isPrimary,
          }))}
        />
      </FormSection>

      <FormSection title="Visibility">
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle
            name="isPublished"
            label="Published"
            hint="Unpublished projects are hidden from the website."
            defaultChecked={project?.isPublished ?? true}
          />
          <Toggle
            name="isFeatured"
            label="Featured"
            hint="Featured projects appear in the home page carousel."
            defaultChecked={project?.isFeatured ?? false}
          />
        </div>
      </FormSection>

      <div className="flex justify-end gap-3">
        <SubmitButton>{project ? 'Save changes' : 'Create project'}</SubmitButton>
      </div>
    </form>
  )
}
