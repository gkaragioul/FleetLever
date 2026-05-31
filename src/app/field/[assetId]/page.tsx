import { notFound, redirect } from "next/navigation";
import { AlertTriangle, FileUp, QrCode, Truck } from "lucide-react";
import { createDocument, createIssue } from "@/app/actions";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
import { getFleetLeverData } from "@/lib/db/fleetlever-data";
import { documentStatus, formatDate } from "@/lib/fleetlever";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  KTEO: "KTEO",
  Insurance: "Ασφάλεια",
  Permit: "Άδεια",
  "Lifting certificate": "Πιστοποιητικό ανύψωσης",
  "Periodic inspection": "Περιοδικός έλεγχος",
  "Operator license": "Άδεια χειριστή",
  "Maintenance invoice": "Τιμολόγιο συντήρησης",
  "Safety document": "Έγγραφο ασφαλείας",
};

const documentCategories = Object.keys(categoryLabels);

function pillClass(tone: string) {
  if (tone === "expired" || tone === "blocked") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "critical" || tone === "warning" || tone === "under review") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

async function submitIssue(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");
  await createIssue(formData);
  redirect(`/field/${assetId}?saved=issue`);
}

async function submitDocument(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");
  await createDocument(formData);
  redirect(`/field/${assetId}?saved=document`);
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
      ? "Η βλάβη καταχωρήθηκε."
      : query.saved === "document"
        ? "Το έγγραφο ανέβηκε και μπήκε σε έλεγχο."
        : "";

  return (
    <main className="min-h-screen bg-[#edf1ee] px-4 py-5 text-[#13211f] sm:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <FleetLeverLogo />
          <span className="inline-flex items-center gap-2 rounded-md border border-[#cfe3da] bg-[#eaf5ef] px-3 py-2 text-sm font-semibold text-[#123d37]">
            <QrCode size={16} />
            Field mode
          </span>
        </header>

        {savedMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {savedMessage}
          </div>
        ) : null}

        <section className="rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117064]">{asset.type}</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold leading-tight">{asset.code} · {asset.name}</h1>
              <p className="mt-2 text-sm text-slate-600">{asset.plate ?? asset.serial} · {asset.location}</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${pillClass(asset.status)}`}>
              {asset.status === "ready" ? "έτοιμο" : asset.status === "blocked" ? "μη διαθέσιμο" : "προσοχή"}
            </span>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2">
              <FileUp size={18} className="text-[#11685f]" />
              <h2 className="text-lg font-semibold">Ανέβασμα εγγράφου</h2>
            </div>
            <form action={submitDocument} className="mt-4 grid gap-3">
              <input type="hidden" name="assetId" value={asset.id} />
              <label className="grid gap-1.5 text-sm font-medium">
                Τίτλος
                <input
                  name="title"
                  required
                  placeholder={`${asset.code} νέο έγγραφο`}
                  className="h-11 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 outline-none focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Κατηγορία
                <select
                  name="category"
                  required
                  defaultValue={missing[0] ?? "Insurance"}
                  className="h-11 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 outline-none focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                >
                  {documentCategories.map((category) => (
                    <option key={category} value={category}>{categoryLabels[category]}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Λήξη
                <input
                  name="expiresAt"
                  type="date"
                  className="h-11 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 outline-none focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Αρχείο
                <input
                  name="file"
                  type="file"
                  className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#e2f0ea] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#123d37]"
                />
              </label>
              <button type="submit" className="mt-1 h-11 rounded-md bg-[#11685f] px-4 text-sm font-semibold text-white">
                Ανέβασμα
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#b23838]" />
              <h2 className="text-lg font-semibold">Αναφορά βλάβης</h2>
            </div>
            <form action={submitIssue} className="mt-4 grid gap-3">
              <input type="hidden" name="assetId" value={asset.id} />
              <label className="grid gap-1.5 text-sm font-medium">
                Τίτλος
                <input
                  name="title"
                  required
                  placeholder="Τι πρόβλημα υπάρχει;"
                  className="h-11 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 outline-none focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Σοβαρότητα
                <select
                  name="severity"
                  defaultValue="medium"
                  className="h-11 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 outline-none focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                >
                  <option value="low">Χαμηλή</option>
                  <option value="medium">Μεσαία</option>
                  <option value="high">Υψηλή</option>
                  <option value="critical">Κρίσιμη</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Περιγραφή
                <textarea
                  name="description"
                  rows={4}
                  className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2 outline-none focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input name="blocking" type="checkbox" className="h-4 w-4 rounded border-[#d9e2dc]" />
                Μπλοκάρει ανάθεση
              </label>
              <button type="submit" className="mt-1 h-11 rounded-md bg-[#11685f] px-4 text-sm font-semibold text-white">
                Καταχώριση βλάβης
              </button>
            </form>
          </section>
        </div>

        <section className="grid gap-4 rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-[#11685f]" />
              <h2 className="text-lg font-semibold">Λείπουν</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {missing.length ? missing.map((category) => (
                <span key={category} className="rounded-full border border-[#d9e2dc] bg-[#f7faf4] px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {categoryLabels[category] ?? category}
                </span>
              )) : <span className="text-sm text-emerald-700">Δεν λείπουν απαιτούμενα έγγραφα.</span>}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Τρέχοντα records</h2>
            <div className="mt-3 space-y-2">
              {assetDocuments.slice(0, 4).map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{document.title}</span>
                    <span className="text-xs text-slate-500">{document.expiresAt ? formatDate(document.expiresAt) : "Χωρίς λήξη"}</span>
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
