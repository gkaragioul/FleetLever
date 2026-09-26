"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Crop,
  ImageIcon,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  createCustomFieldDefinition,
  customFieldModuleLabels,
  customFieldTypeLabels,
  defaultBrandingSettings,
  type BrandAsset,
  type BrandingSettings,
  type CustomFieldDefinition,
  type CustomFieldModule,
  type CustomFieldType,
} from "@/lib/fleetlever/customization";

type BrandKind = "logo" | "compactLogo" | "banner";

const acceptedImageTypes = "image/png,image/jpeg,image/webp";
const maxBrandFileBytes = 5 * 1024 * 1024;

function defaultValueText(value: CustomFieldDefinition["defaultValue"]) {
  if (value === null) return "";
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function parseDefaultValue(type: CustomFieldType, value: string, options: string[]) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (type === "boolean") return trimmed === "true";
  if (type === "number" || type === "currency" || type === "percentage") {
    const number = Number.parseFloat(trimmed);
    return Number.isFinite(number) ? number : null;
  }
  if (type === "multi-select") return trimmed.split(",").map((item) => item.trim()).filter((item) => options.includes(item));
  if (type === "single-select") return options.includes(trimmed) ? trimmed : null;
  return trimmed;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be opened."));
    image.src = src;
  });
}

async function renderBrandAsset(source: string, kind: BrandKind, settings: Omit<BrandAsset, "dataUrl" | "fileName">) {
  const image = await loadImage(source);
  const target = kind === "banner" ? { width: 1600, height: 480 } : kind === "compactLogo" ? { width: 420, height: 420 } : { width: 800, height: 300 };
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image editing is not supported in this browser.");

  const containScale = Math.min(target.width / image.naturalWidth, target.height / image.naturalHeight);
  const coverScale = Math.max(target.width / image.naturalWidth, target.height / image.naturalHeight);
  const scale = (settings.fit === "cover" ? coverScale : containScale) * settings.zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (target.width - width) * (settings.positionX / 100);
  const y = (target.height - height) * (settings.positionY / 100);

  context.clearRect(0, 0, target.width, target.height);
  context.drawImage(image, x, y, width, height);
  return canvas.toDataURL(kind === "banner" ? "image/webp" : "image/png", 0.9);
}

function BrandCropDialog({
  file,
  kind,
  onCancel,
  onSave,
}: {
  file: File;
  kind: BrandKind;
  onCancel: () => void;
  onSave: (asset: BrandAsset) => void;
}) {
  const [source, setSource] = useState("");
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [fit, setFit] = useState<"contain" | "cover">(kind === "banner" ? "cover" : "contain");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dragRef = useRef<{ x: number; y: number; positionX: number; positionY: number } | null>(null);

  useEffect(() => {
    let active = true;
    void readFileAsDataUrl(file)
      .then((nextSource) => {
        if (active) setSource(nextSource);
      })
      .catch((nextError) => {
        if (active) setError(nextError instanceof Error ? nextError.message : "The image could not be read.");
      });
    return () => {
      active = false;
    };
  }, [file]);

  async function save() {
    if (!source || saving) return;
    setSaving(true);
    setError("");
    try {
      const dataUrl = await renderBrandAsset(source, kind, { fit, positionX, positionY, zoom });
      onSave({ dataUrl, fileName: file.name.slice(0, 140), fit, positionX, positionY, zoom });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The image could not be saved.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#081F1D]/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Crop brand image">
      <section className="w-full max-w-3xl overflow-hidden rounded-md border border-[#CBD9D4] bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <div>
            <p className="text-[11px] font-black uppercase text-[#008C95]">Pan and zoom</p>
            <h2 className="mt-1 text-xl font-black text-[#0D2F2D]">Fit the {kind === "banner" ? "banner" : "logo"}</h2>
          </div>
          <button type="button" onClick={onCancel} className="grid h-11 w-11 place-items-center rounded-md border border-[#D7E2DE]" aria-label="Close editor"><X className="h-5 w-5" /></button>
        </header>
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_15rem]">
          <div
            className={`relative overflow-hidden border border-dashed border-[#8DA9A3] bg-[linear-gradient(45deg,#eef3f0_25%,transparent_25%),linear-gradient(-45deg,#eef3f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eef3f0_75%),linear-gradient(-45deg,transparent_75%,#eef3f0_75%)] bg-[length:24px_24px] ${kind === "banner" ? "aspect-[10/3]" : kind === "compactLogo" ? "aspect-square" : "aspect-[8/3]"}`}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = { x: event.clientX, y: event.clientY, positionX, positionY };
            }}
            onPointerMove={(event) => {
              if (!dragRef.current) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              setPositionX(Math.max(0, Math.min(100, dragRef.current.positionX + ((event.clientX - dragRef.current.x) / bounds.width) * 100)));
              setPositionY(Math.max(0, Math.min(100, dragRef.current.positionY + ((event.clientY - dragRef.current.y) / bounds.height) * 100)));
            }}
            onPointerUp={() => { dragRef.current = null; }}
          >
            {source ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={source} alt="Brand preview" className={`h-full w-full select-none ${fit === "cover" ? "object-cover" : "object-contain"}`} style={{ objectPosition: `${positionX}% ${positionY}%`, transform: `scale(${zoom})` }} draggable={false} />
            ) : null}
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-sm bg-[#0D2F2D]/80 px-2 py-1 text-[10px] font-bold text-white">Drag to position</span>
          </div>
          <div className="space-y-5">
            <label className="block text-xs font-bold text-[#334E4A]">Fit mode
              <select value={fit} onChange={(event) => setFit(event.target.value as "contain" | "cover")} className="mt-2 h-11 w-full rounded-md border border-[#CBD9D4] bg-white px-3 text-sm font-bold">
                <option value="contain">Contain</option>
                <option value="cover">Fill and crop</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-[#334E4A]">Zoom <span className="float-right">{Math.round(zoom * 100)}%</span>
              <input type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-3 w-full accent-[#008C95]" />
            </label>
            <button type="button" onClick={() => { setZoom(1); setPositionX(50); setPositionY(50); }} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#CBD9D4] text-sm font-bold"><RotateCcw className="h-4 w-4" /> Reset position</button>
            <p className="text-xs leading-5 text-[#64748B]">PNG transparency is preserved for logos. Banners are optimized to WebP after cropping.</p>
          </div>
        </div>
        {error ? <p className="mx-5 mb-3 rounded-sm border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm font-bold text-[#B91C1C]">{error}</p> : null}
        <footer className="flex justify-end gap-2 border-t border-[#E2E8F0] px-5 py-4">
          <button type="button" onClick={onCancel} className="h-11 rounded-md border border-[#CBD9D4] px-5 text-sm font-bold">Cancel</button>
          <button type="button" onClick={() => void save()} disabled={!source || saving} className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0D2F2D] px-5 text-sm font-bold text-white disabled:opacity-50"><Crop className="h-4 w-4" />{saving ? "Saving…" : "Use image"}</button>
        </footer>
      </section>
    </div>
  );
}

function BrandSlot({
  asset,
  kind,
  label,
  guidance,
  onChange,
}: {
  asset: BrandAsset | null;
  kind: BrandKind;
  label: string;
  guidance: string;
  onChange: (asset: BrandAsset | null) => void;
}) {
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputId = `brand-${kind}`;

  function selectFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!acceptedImageTypes.split(",").includes(file.type)) return setError("Use PNG, JPEG or WebP. SVG files are not accepted.");
    if (file.size > maxBrandFileBytes) return setError("Images must be 5 MB or smaller.");
    setEditingFile(file);
  }

  return (
    <div
      className={`min-w-0 border-t py-5 transition-colors first:border-t-0 first:pt-0 ${dragActive ? "border-[#27B8BF] bg-[#ECFBFA]" : "border-[#E2E8F0]"}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setDragActive(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        selectFile(event.dataTransfer.files?.[0]);
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className={`grid shrink-0 place-items-center overflow-hidden border border-[#D6E1DD] bg-[#F6F9F7] ${kind === "banner" ? "h-24 w-full sm:w-64" : kind === "compactLogo" ? "h-24 w-24" : "h-24 w-52"}`}>
          {asset ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.dataUrl} alt={`${label} preview`} className={`h-full w-full ${asset.fit === "cover" ? "object-cover" : "object-contain"}`} />
          ) : <ImageIcon className="h-7 w-7 text-[#8AA09A]" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-[#0D2F2D]">{label}</h3>
          <p className="mt-1 text-sm leading-5 text-[#64748B]">{guidance}</p>
          <p className="mt-1 text-xs font-semibold text-[#55706B]">Drop an image anywhere in this row, or choose a file.</p>
          {asset ? <p className="mt-1 truncate text-xs font-semibold text-[#008C95]">{asset.fileName}</p> : null}
          {error ? <p className="mt-2 text-xs font-bold text-[#B91C1C]">{error}</p> : null}
        </div>
        <div className="flex gap-2">
          <label htmlFor={inputId} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-[#BDD3CF] bg-[#F4FAF8] px-4 text-sm font-bold text-[#0D4A46]"><Upload className="h-4 w-4" />{asset ? "Replace" : "Upload"}</label>
          <input id={inputId} type="file" accept={acceptedImageTypes} aria-label={`${asset ? "Replace" : "Upload"} ${label}`} className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} />
          {asset ? <button type="button" onClick={() => onChange(null)} className="grid h-11 w-11 place-items-center rounded-md border border-[#FECACA] text-[#B91C1C]" aria-label={`Remove ${label}`}><Trash2 className="h-4 w-4" /></button> : null}
        </div>
      </div>
      {editingFile ? <BrandCropDialog file={editingFile} kind={kind} onCancel={() => setEditingFile(null)} onSave={(nextAsset) => { onChange(nextAsset); setEditingFile(null); }} /> : null}
    </div>
  );
}

function FieldEditor({
  field,
  onCancel,
  onSave,
}: {
  field?: CustomFieldDefinition;
  onCancel: () => void;
  onSave: (field: CustomFieldDefinition) => void;
}) {
  const [name, setName] = useState(field?.name ?? "");
  const [description, setDescription] = useState(field?.description ?? "");
  const [module, setModule] = useState<CustomFieldModule>(field?.module ?? "assets");
  const [type, setType] = useState<CustomFieldType>(field?.type ?? "short-text");
  const [required, setRequired] = useState(field?.required ?? false);
  const [width, setWidth] = useState(field?.width ?? 150);
  const [options, setOptions] = useState(field?.options.join(", ") ?? "");
  const [defaultValue, setDefaultValue] = useState(defaultValueText(field?.defaultValue ?? null));
  const [visibility, setVisibility] = useState(field?.visibility ?? { table: true, form: true, export: true });

  const selectType = type === "single-select" || type === "multi-select";
  return (
    <form
      className="border-t border-[#DDE7E3] bg-[#F8FAF9] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) return;
        const normalizedOptions = options.split(",").map((option) => option.trim()).filter(Boolean).slice(0, 40);
        onSave(createCustomFieldDefinition({ ...field, module, name, description, type, required, width, options: normalizedOptions, defaultValue: parseDefaultValue(type, defaultValue, normalizedOptions), visibility }, field?.order ?? 0));
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs font-bold text-[#334E4A]">Field name<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Battery level" className="mt-2 h-11 w-full rounded-md border border-[#CBD9D4] bg-white px-3 text-sm" /></label>
        <label className="text-xs font-bold text-[#334E4A]">Module<select value={module} onChange={(event) => setModule(event.target.value as CustomFieldModule)} className="mt-2 h-11 w-full rounded-md border border-[#CBD9D4] bg-white px-3 text-sm">{Object.entries(customFieldModuleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-xs font-bold text-[#334E4A]">Data type<select value={type} onChange={(event) => setType(event.target.value as CustomFieldType)} className="mt-2 h-11 w-full rounded-md border border-[#CBD9D4] bg-white px-3 text-sm">{Object.entries(customFieldTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-xs font-bold text-[#334E4A]">Column width <span className="float-right">{width}px</span><input type="range" min="100" max="360" step="10" value={width} onChange={(event) => setWidth(Number(event.target.value))} className="mt-4 w-full accent-[#008C95]" /></label>
        <label className="text-xs font-bold text-[#334E4A] md:col-span-2">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-20 w-full rounded-md border border-[#CBD9D4] bg-white p-3 text-sm" /></label>
        {selectType ? <label className="text-xs font-bold text-[#334E4A] md:col-span-2">Options, separated by commas<input value={options} onChange={(event) => setOptions(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#CBD9D4] bg-white px-3 text-sm" /></label> : null}
        <label className="text-xs font-bold text-[#334E4A] md:col-span-2">Default value
          {type === "boolean" ? (
            <select value={defaultValue} onChange={(event) => setDefaultValue(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#CBD9D4] bg-white px-3 text-sm">
              <option value="">No default</option><option value="true">Yes</option><option value="false">No</option>
            </select>
          ) : type === "single-select" ? (
            <select value={defaultValue} onChange={(event) => setDefaultValue(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#CBD9D4] bg-white px-3 text-sm">
              <option value="">No default</option>{options.split(",").map((option) => option.trim()).filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <input
              type={type === "date" ? "date" : type === "datetime" ? "datetime-local" : type === "number" || type === "currency" || type === "percentage" ? "number" : "text"}
              value={defaultValue}
              onChange={(event) => setDefaultValue(event.target.value)}
              placeholder={type === "multi-select" ? "Comma-separated selected options" : "Optional"}
              min={type === "percentage" ? 0 : undefined}
              max={type === "percentage" ? 100 : undefined}
              className="mt-2 h-11 w-full rounded-md border border-[#CBD9D4] bg-white px-3 text-sm"
            />
          )}
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["table", "form", "export"] as const).map((target) => <label key={target} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#CBD9D4] bg-white px-3 text-sm font-bold"><input type="checkbox" checked={visibility[target]} onChange={(event) => setVisibility((current) => ({ ...current, [target]: event.target.checked }))} /> Show in {target}</label>)}
        <label className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#CBD9D4] bg-white px-3 text-sm font-bold"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} /> Required</label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-11 rounded-md border border-[#CBD9D4] px-4 text-sm font-bold">Cancel</button>
        <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white"><Check className="h-4 w-4" /> Save field</button>
      </div>
    </form>
  );
}

export function SettingsView({
  branding,
  customFields,
  onBrandingChange,
  onCustomFieldsChange,
}: {
  branding: BrandingSettings;
  customFields: CustomFieldDefinition[];
  onBrandingChange: (branding: BrandingSettings) => void;
  onCustomFieldsChange: (fields: CustomFieldDefinition[]) => void;
}) {
  const [editingFieldId, setEditingFieldId] = useState<string | "new" | null>(null);
  const sortedFields = [...customFields].sort((left, right) => left.module.localeCompare(right.module) || left.order - right.order);

  function saveField(field: CustomFieldDefinition) {
    const exists = customFields.some((item) => item.id === field.id);
    const next = exists ? customFields.map((item) => item.id === field.id ? field : item) : [...customFields, { ...field, order: customFields.filter((item) => item.module === field.module).length }];
    onCustomFieldsChange(next);
    setEditingFieldId(null);
  }

  function moveField(field: CustomFieldDefinition, direction: -1 | 1) {
    const moduleFields = customFields.filter((item) => item.module === field.module).sort((left, right) => left.order - right.order);
    const index = moduleFields.findIndex((item) => item.id === field.id);
    const swap = moduleFields[index + direction];
    if (!swap) return;
    onCustomFieldsChange(customFields.map((item) => item.id === field.id ? { ...item, order: swap.order } : item.id === swap.id ? { ...item, order: field.order } : item));
  }

  function addBatteryTemplate() {
    const field = createCustomFieldDefinition({ module: "assets", name: "Battery level", description: "Current charge available before release.", type: "percentage", width: 130 }, customFields.filter((item) => item.module === "assets").length);
    onCustomFieldsChange([...customFields, field]);
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 border-b border-[#CBD9D4] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[11px] font-black uppercase text-[#008C95]">Organization controls</p><h1 className="mt-1 text-2xl font-black text-[#0D2F2D]">Settings</h1><p className="mt-1 text-sm text-[#64748B]">Make FleetLever fit your operation without changing its release-control workflow.</p></div>
        <Settings2 className="h-7 w-7 text-[#008C95]" aria-hidden="true" />
      </header>

      <section className="overflow-hidden rounded-md border border-[#CBD9D4] bg-white shadow-sm">
        <div className="border-b border-[#E2E8F0] px-5 py-4"><p className="text-[11px] font-black uppercase text-[#008C95]">Branding</p><h2 className="mt-1 text-xl font-black text-[#0D2F2D]">Your organization, inside FleetLever</h2><p className="mt-1 text-sm text-[#64748B]">Upload safe raster images, then crop and preview them for desktop and mobile.</p></div>
        <div className="p-5">
          <BrandSlot kind="logo" label="Company logo" guidance="Transparent PNG recommended. 800 × 300 working area." asset={branding.logo} onChange={(logo) => onBrandingChange({ ...branding, logo })} />
          <BrandSlot kind="compactLogo" label="Compact mark" guidance="Square icon for narrow navigation and mobile." asset={branding.compactLogo} onChange={(compactLogo) => onBrandingChange({ ...branding, compactLogo })} />
          <BrandSlot kind="banner" label="Workspace banner" guidance="Wide image for the organization header. 1600 × 480 recommended." asset={branding.banner} onChange={(banner) => onBrandingChange({ ...branding, banner })} />
          <div className="mt-2 grid gap-3 md:grid-cols-[1fr_18rem]">
            <div className="relative min-h-28 overflow-hidden rounded-md bg-[#123C36] p-4 text-white" style={branding.banner ? { backgroundImage: `linear-gradient(90deg,rgba(13,47,45,.88),rgba(13,47,45,.32)),url(${branding.banner.dataUrl})`, backgroundPosition: `${branding.banner.positionX}% ${branding.banner.positionY}%`, backgroundSize: branding.banner.fit === "cover" ? "cover" : "contain" } : undefined}>
              <p className="text-[10px] font-black uppercase text-[#8BE4DF]">Desktop preview</p><p className="mt-4 text-xl font-black">Tomorrow&apos;s readiness</p><p className="mt-1 text-xs text-white/75">FleetLever · Your organization</p>
            </div>
            <div className="relative min-h-28 overflow-hidden rounded-md bg-[#123C36] p-4 text-white" style={branding.banner ? { backgroundImage: `linear-gradient(rgba(13,47,45,.82),rgba(13,47,45,.82)),url(${branding.banner.dataUrl})`, backgroundPosition: `${branding.banner.positionX}% ${branding.banner.positionY}%`, backgroundSize: "cover" } : undefined}><p className="text-[10px] font-black uppercase text-[#8BE4DF]">Mobile preview</p><p className="mt-4 text-lg font-black">Ready for next?</p></div>
          </div>
          <button type="button" onClick={() => onBrandingChange(defaultBrandingSettings)} className="mt-4 inline-flex h-11 items-center gap-2 rounded-md border border-[#CBD9D4] px-4 text-sm font-bold"><RotateCcw className="h-4 w-4" /> Reset FleetLever defaults</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#CBD9D4] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[11px] font-black uppercase text-[#008C95]">Custom data</p><h2 className="mt-1 text-xl font-black text-[#0D2F2D]">Fields and columns</h2><p className="mt-1 text-sm text-[#64748B]">Add operational data without deleting protected FleetLever fields.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={addBatteryTemplate} className="h-11 rounded-md border border-[#BDD3CF] bg-[#F4FAF8] px-4 text-sm font-bold text-[#0D4A46]">Add Battery level</button><button type="button" onClick={() => setEditingFieldId("new")} className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white"><Plus className="h-4 w-4" /> New field</button></div></div>
        {editingFieldId === "new" ? <FieldEditor onCancel={() => setEditingFieldId(null)} onSave={saveField} /> : null}
        <div className="divide-y divide-[#E2E8F0]">
          {sortedFields.length ? sortedFields.map((field) => (
            <div key={field.id} className="px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-[#0D2F2D]">{field.name}</h3><span className="rounded-full bg-[#E8F5F3] px-2 py-1 text-[10px] font-black uppercase text-[#007C84]">{customFieldModuleLabels[field.module]}</span>{field.archived ? <span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[10px] font-black uppercase text-[#64748B]">Archived</span> : null}</div><p className="mt-1 text-sm text-[#64748B]">{customFieldTypeLabels[field.type]} · {field.width}px · {[field.visibility.table && "table", field.visibility.form && "form", field.visibility.export && "export"].filter(Boolean).join(", ") || "hidden everywhere"}</p></div>
                <div className="flex items-center gap-1"><button type="button" onClick={() => moveField(field, -1)} className="grid h-11 w-11 place-items-center rounded-md border border-[#D7E2DE]" aria-label={`Move ${field.name} up`}><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => moveField(field, 1)} className="grid h-11 w-11 place-items-center rounded-md border border-[#D7E2DE]" aria-label={`Move ${field.name} down`}><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => setEditingFieldId(field.id)} className="h-11 rounded-md border border-[#D7E2DE] px-4 text-sm font-bold">Edit</button><button type="button" onClick={() => onCustomFieldsChange(customFields.map((item) => item.id === field.id ? { ...item, archived: !item.archived } : item))} className="h-11 rounded-md border border-[#D7E2DE] px-3 text-sm font-bold">{field.archived ? "Restore" : "Archive"}</button><button type="button" onClick={() => { if (window.confirm(`Delete ${field.name}? Existing values will be kept in records but hidden.`)) onCustomFieldsChange(customFields.filter((item) => item.id !== field.id)); }} className="grid h-11 w-11 place-items-center rounded-md border border-[#FECACA] text-[#B91C1C]" aria-label={`Delete ${field.name}`}><Trash2 className="h-4 w-4" /></button></div>
              </div>
              {editingFieldId === field.id ? <FieldEditor field={field} onCancel={() => setEditingFieldId(null)} onSave={saveField} /> : null}
            </div>
          )) : <div className="px-5 py-12 text-center"><p className="font-black text-[#0D2F2D]">No custom fields yet</p><p className="mt-1 text-sm text-[#64748B]">Start with Battery level or create a field for any operational module.</p></div>}
        </div>
      </section>
    </div>
  );
}
