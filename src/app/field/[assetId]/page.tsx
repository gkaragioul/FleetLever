import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Camera, CheckCircle2, FileUp, QrCode, Truck } from "lucide-react";
import { createDocument, createIssue } from "@/app/actions";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
import { getFleetLeverData } from "@/lib/db/fleetlever-data";
import { documentStatus, formatDate } from "@/lib/fleetlever";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  KTEO: "Roadworthiness",
  Insurance: "Insurance",
  Permit: "Permit",
  "Lifting certificate": "Lifting certificate",
  "Periodic inspection": "Periodic inspection",
  "Operator license": "Operator license",
  "Maintenance invoice": "Maintenance invoice",
  "Safety document": "Safety document",
};

const documentCategories = Object.keys(categoryLabels);

const requiredPhotoSlots = [
  "Front view",
  "Rear view",
  "Left side",
  "Right side",
  "Hour meter / dashboard",
  "Attachment / bucket / tool",
  "Visible damage if present",
  "Fuel / battery status",
  "Yard context",
] as const;

function pillClass(tone: string) {
  if (tone === "expired" || tone === "blocked") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "critical" || tone === "warning" || tone === "under review" || tone === "attention") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function releaseLabel(status: string) {
  if (status === "ready") return "Ready";
  if (status === "blocked") return "Blocked";
  if (status === "inactive") return "Inactive";
  return "Needs review";
}

async function submitIssue(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");
  await createIssue(formData);
  redirect(`/field/${assetId}?saved=issue`);
}

async function submitProof(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");
  await createDocument(formData);
  redirect(`/field/${assetId}?saved=proof`);
}

export default async function FieldAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ assetId: string }>;
  searchParams?: Promise<{ saved?: string }>;
}) {
  const { assetId } = await params;
  const query = searchParams ? await searchParams : {};
  const data = await getFleetLeverData();
  const asset = data.assets.find((item) => item.id === assetId);

  if (!asset) {
    notFound();
  }

  const assetDocuments = data.documents.filter((document) => document.assetId === asset.id);
  const openIssues = data.issues.filter((issue) => issue.assetId === asset.id && issue.status !== "resolved");
  const template = data.complianceTemplates.find((item) => item.assetType === asset.type);
  const presentCategories = new Set(assetDocuments.map((document) => document.category));
  const missing = template?.requiredCategories.filter((category) => !presentCategories.has(category)) ?? [];
  const savedMessage =
    query.saved === "issue"
      ? "Defect reported. Supervisor review is now required."
      : query.saved === "proof"
        ? "Proof uploaded and added to the handover review."
        : "";

  return (
    <main className="min-h-screen bg-[#eef1f3] px-4 py-5 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <Link
            href="/console"
            className="rounded-md transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Go to FleetLever release board"
          >
            <FleetLeverLogo />
          </Link>
          <span className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800">
            <QrCode size={16} />
            Operator handover
          </span>
        </header>

        {savedMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {savedMessage}
          </div>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-normal text-sky-700">{asset.type}</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold leading-tight">{asset.code} · {asset.name}</h1>
              <p className="mt-2 text-sm font-medium text-slate-600">{asset.plate ?? asset.serial} · {asset.location}</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${pillClass(asset.status)}`}>
              {releaseLabel(asset.status)}
            </span>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-sky-700" />
            <h2 className="text-lg font-semibold">Required proof photos</h2>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {requiredPhotoSlots.map((slot, index) => (
              <div key={slot} className="flex min-h-11 items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                <span>{slot}</span>
                {index < assetDocuments.length ? <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" /> : <span className="text-xs font-bold text-sky-700">needed</span>}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileUp size={18} className="text-sky-700" />
              <h2 className="text-lg font-semibold">Upload proof</h2>
            </div>
            <form action={submitProof} className="mt-4 grid gap-3">
              <input type="hidden" name="assetId" value={asset.id} />
              <label className="grid gap-1.5 text-sm font-medium">
                Proof title
                <input
                  name="title"
                  required
                  placeholder={`${asset.code} hour meter photo`}
                  className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Evidence category
                <select
                  name="category"
                  required
                  defaultValue={missing[0] ?? "Safety document"}
                  className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  {documentCategories.map((category) => (
                    <option key={category} value={category}>{categoryLabels[category]}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Expiry, if relevant
                <input
                  name="expiresAt"
                  type="date"
                  className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Photo or file
                <input
                  name="file"
                  type="file"
                  accept="image/*,.pdf"
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sky-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-sky-800"
                />
              </label>
              <button type="submit" className="mt-1 h-11 rounded-md bg-sky-700 px-4 text-sm font-semibold text-white">
                Add proof to handover
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-700" />
              <h2 className="text-lg font-semibold">Report visible defect</h2>
            </div>
            <form action={submitIssue} className="mt-4 grid gap-3">
              <input type="hidden" name="assetId" value={asset.id} />
              <label className="grid gap-1.5 text-sm font-medium">
                Defect title
                <input
                  name="title"
                  required
                  placeholder="What problem is visible?"
                  className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Severity
                <select
                  name="severity"
                  defaultValue="medium"
                  className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Description
                <textarea
                  name="description"
                  rows={4}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input name="blocking" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                This defect should block release
              </label>
              <button type="submit" className="mt-1 h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">
                Report defect
              </button>
            </form>
          </section>
        </div>

        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-sky-700" />
              <h2 className="text-lg font-semibold">Missing release evidence</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {missing.length ? missing.map((category) => (
                <span key={category} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                  {categoryLabels[category] ?? category}
                </span>
              )) : <span className="text-sm font-semibold text-emerald-700">Required evidence categories are present.</span>}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Current proof and defects</h2>
            <div className="mt-3 space-y-2">
              {assetDocuments.slice(0, 4).map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{document.title}</span>
                    <span className="text-xs text-slate-500">{document.expiresAt ? formatDate(document.expiresAt) : "No expiry"}</span>
                  </span>
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${pillClass(documentStatus(document))}`}>
                    {documentStatus(document)}
                  </span>
                </div>
              ))}
              {openIssues.map((issue) => (
                <div key={issue.id} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                  {issue.title}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
