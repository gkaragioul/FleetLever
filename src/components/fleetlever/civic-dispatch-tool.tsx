"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  MessageSquareText,
  ParkingCircle,
  RadioTower,
  Trash2,
  Truck,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import {
  buildCivicLisaOpening,
  civicLisaPrompts,
  parseCivicLisaIntent,
  resolveCivicLisaIntent,
} from "@/components/fleetlever/civic-lisa";
import { PortalReturnLink } from "@/components/fleetlever/municipal-brand";
import { MunicipalLisaAssistant } from "@/components/fleetlever/municipal-lisa-assistant";
import { useMemo, useState } from "react";

type CategoryId = "waste" | "rubble" | "fault" | "parking" | "other";
type StageId = "citizen" | "triage" | "department" | "field" | "done";
type QueueFilter = "all" | "urgent" | "unassigned" | "field";

type CivicRequest = {
  id: string;
  title: string;
  category: CategoryId;
  address: string;
  ward: string;
  citizen: string;
  note: string;
  photoLabel: string;
  stage: StageId;
  department: string;
  assignee: string;
  vehicle: string;
  due: string;
  response: string;
  urgent: boolean;
  x: number;
  y: number;
  heat: number;
};

type CategoryConfig = {
  title: string;
  short: string;
  department: string;
  defaultAssignee: string;
  defaultVehicle: string;
  icon: typeof Trash2;
};

const categories: Record<CategoryId, CategoryConfig> = {
  waste: {
    title: "Απορρίμματα",
    short: "Κάδοι / σκουπίδια",
    department: "Καθαριότητα",
    defaultAssignee: "Πλήρωμα αποκομιδής Α2",
    defaultVehicle: "Απορριμματοφόρο ΚΘ-214",
    icon: Trash2,
  },
  rubble: {
    title: "Βαρέα μπάζα",
    short: "Ογκώδη / μπάζα",
    department: "Αποκομιδή ογκωδών",
    defaultAssignee: "Ομάδα φορτηγού Β1",
    defaultVehicle: "Φορτηγάκι ΔΗΜ-32",
    icon: Truck,
  },
  fault: {
    title: "Βλάβες",
    short: "Φώτα / νερά / ζημιές",
    department: "Τεχνική υπηρεσία",
    defaultAssignee: "Τεχνικό συνεργείο Τ4",
    defaultVehicle: "Van τεχνικών ΤΧ-18",
    icon: Wrench,
  },
  parking: {
    title: "Παράνομη στάθμευση",
    short: "Δεν περνάμε",
    department: "Δημοτική αστυνομία",
    defaultAssignee: "Κλιμάκιο ελέγχου Π3",
    defaultVehicle: "Όχημα ΔΑ-07",
    icon: ParkingCircle,
  },
  other: {
    title: "Άλλο",
    short: "Δεν ξέρω κατηγορία",
    department: "Κέντρο διαχείρισης",
    defaultAssignee: "Υπάλληλος πρώτης γραμμής",
    defaultVehicle: "Χωρίς όχημα",
    icon: AlertTriangle,
  },
};

const stageCopy: Record<StageId, { title: string; short: string }> = {
  citizen: { title: "Νέο αίτημα", short: "ο δημότης έστειλε στίγμα και φωτογραφία" },
  triage: { title: "Έλεγχος", short: "ο πρώτος υπάλληλος το καθαρίζει" },
  department: { title: "Ανάθεση", short: "η υπηρεσία ορίζει άνθρωπο και όχημα" },
  field: { title: "Στο πεδίο", short: "το συνεργείο εκτελεί" },
  done: { title: "Ολοκληρώθηκε", short: "ο δημότης ενημερώθηκε" },
};

const stageOrder: StageId[] = ["citizen", "triage", "department", "field", "done"];

const initialRequests: CivicRequest[] = [
  {
    id: "REQ-258104",
    title: "Παρατημένο αυτοκίνητο, δεν περνάμε",
    category: "parking",
    address: "Μητροπόλεως 18",
    ward: "Κέντρο",
    citizen: "Δημότης μέσω mobile",
    note: "Να εδώ το παράτησε ο άλλος και το φορτηγό δεν μπορεί να στρίψει.",
    photoLabel: "φωτογραφία οχήματος",
    stage: "department",
    department: "Δημοτική αστυνομία",
    assignee: "Κλιμάκιο ελέγχου Π3",
    vehicle: "Όχημα ΔΑ-07",
    due: "Σήμερα 16:30",
    response: "Έχει ανατεθεί σε δημοτική αστυνομία για έλεγχο και πρόστιμο.",
    urgent: true,
    x: 58,
    y: 42,
    heat: 94,
  },
  {
    id: "REQ-258088",
    title: "Θέλω να πετάξω μπάζα",
    category: "rubble",
    address: "Καρόλου Ντηλ 9",
    ward: "Εμπορικό κέντρο",
    citizen: "Δημότης μέσω web",
    note: "Υπάρχουν μπάζα από μικρή ανακαίνιση. Χρειάζεται αποκομιδή.",
    photoLabel: "φωτογραφία μπαζών",
    stage: "field",
    department: "Αποκομιδή ογκωδών",
    assignee: "Ομάδα φορτηγού Β1",
    vehicle: "Φορτηγάκι ΔΗΜ-32",
    due: "Αύριο 09:00",
    response: "Το φορτηγό Β1 έχει προγραμματιστεί για αύριο το πρωί.",
    urgent: false,
    x: 34,
    y: 61,
    heat: 68,
  },
  {
    id: "REQ-258071",
    title: "Σπασμένο φωτιστικό στην πλατεία",
    category: "fault",
    address: "Πλατεία Ναυαρίνου",
    ward: "Πανεπιστήμιο",
    citizen: "Δημότης μέσω mobile",
    note: "Το φως δεν ανάβει εδώ και τρεις μέρες.",
    photoLabel: "φωτογραφία κολώνας",
    stage: "triage",
    department: "Τεχνική υπηρεσία",
    assignee: "Δεν ανατέθηκε",
    vehicle: "Δεν ορίστηκε",
    due: "Χρειάζεται έλεγχος",
    response: "Αναμονή για ανάθεση στην τεχνική υπηρεσία.",
    urgent: false,
    x: 47,
    y: 24,
    heat: 51,
  },
  {
    id: "REQ-258063",
    title: "Σκουπίδια δίπλα στους κάδους",
    category: "waste",
    address: "Βασ. Όλγας 72",
    ward: "Ανατολικά",
    citizen: "Δημότης μέσω mobile",
    note: "Έχουν αφήσει σακούλες και δεν περνάει πεζός από το πεζοδρόμιο.",
    photoLabel: "φωτογραφία πεζοδρομίου",
    stage: "triage",
    department: "Καθαριότητα",
    assignee: "Δεν ανατέθηκε",
    vehicle: "Δεν ορίστηκε",
    due: "Σήμερα",
    response: "Περιμένει επιβεβαίωση κατηγορίας.",
    urgent: false,
    x: 72,
    y: 69,
    heat: 46,
  },
];

const googleMapsEmbedUrl = "https://www.google.com/maps?q=37.9035,23.7430&z=13&hl=el&output=embed";

function nextStage(stage: StageId): StageId {
  const index = stageOrder.indexOf(stage);
  return stageOrder[Math.min(index + 1, stageOrder.length - 1)];
}

function requestPriority(request: CivicRequest) {
  if (request.urgent) return "Άμεσο";
  if (request.stage === "field") return "Σε εκτέλεση";
  if (request.stage === "done") return "Κλειστό";
  return "Κανονικό";
}

export function CivicDispatchTool() {
  const [requests, setRequests] = useState<CivicRequest[]>(initialRequests);
  const [selectedId, setSelectedId] = useState(initialRequests[0].id);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
  const [lisaOpen, setLisaOpen] = useState(false);

  const selected = requests.find((request) => request.id === selectedId) ?? requests[0];
  const selectedCategory = categories[selected.category];
  const SelectedIcon = selectedCategory.icon;

  const summary = useMemo(
    () => ({
      open: requests.filter((request) => request.stage !== "done").length,
      urgent: requests.filter((request) => request.urgent && request.stage !== "done").length,
      field: requests.filter((request) => request.stage === "field").length,
      done: requests.filter((request) => request.stage === "done").length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(
    () => requests.filter((request) => {
      if (queueFilter === "urgent") return request.urgent && request.stage !== "done";
      if (queueFilter === "unassigned") return request.assignee === "Δεν ανατέθηκε" && request.stage !== "done";
      if (queueFilter === "field") return request.stage === "field";
      return request.stage !== "done";
    }),
    [queueFilter, requests],
  );

  const workflowStages = ["triage", "department", "field", "done"] as const;
  const workflowIndex = selected.stage === "citizen" ? 0 : Math.max(0, workflowStages.indexOf(selected.stage as (typeof workflowStages)[number]));

  const hotspots = useMemo(
    () => [
      { id: "center", label: "Κέντρο", x: 54, y: 44, count: 18 },
      { id: "east", label: "Άνω Ελληνικό", x: 72, y: 68, count: 9 },
      { id: "waterfront", label: "Παραλιακή ζώνη", x: 34, y: 62, count: 11 },
      { id: "argyroupoli", label: "Αργυρούπολη", x: 46, y: 25, count: 6 },
    ],
    [],
  );

  function updateSelected(update: Partial<CivicRequest>) {
    setRequests((current) =>
      current.map((request) => (request.id === selected.id ? { ...request, ...update } : request)),
    );
  }

  function assignDepartment() {
    const defaults = categories[selected.category];
    updateSelected({
      stage: "department",
      department: defaults.department,
      assignee: defaults.defaultAssignee,
      vehicle: defaults.defaultVehicle,
      due: selected.category === "rubble" ? "Αύριο 09:00" : "Σήμερα 16:30",
      response:
        selected.category === "parking"
          ? "Η δημοτική αστυνομία ανέλαβε έλεγχο στο σημείο."
          : "Η αρμόδια υπηρεσία ανέλαβε το αίτημα.",
    });
  }

  function advanceSelected() {
    const stage = nextStage(selected.stage);
    updateSelected({
      stage,
      response:
        stage === "field"
          ? `${selected.assignee} κινείται με ${selected.vehicle}.`
          : stage === "done"
            ? "Εξετελέσθη. Ο δημότης ενημερώθηκε."
            : selected.response,
    });
  }

  function completeSelected() {
    updateSelected({
      stage: "done",
      response: "Η εργασία ολοκληρώθηκε και ο δημότης ενημερώθηκε.",
    });
  }

  const primaryAction = selected.stage === "citizen" || selected.stage === "triage"
    ? { label: "Ανάθεση υπηρεσίας", icon: ClipboardList, run: assignDepartment }
    : selected.stage === "department"
      ? { label: "Αποστολή στο πεδίο", icon: Truck, run: advanceSelected }
      : selected.stage === "field"
        ? { label: "Ολοκλήρωση εργασίας", icon: BadgeCheck, run: completeSelected }
        : null;

  const lisaOpeningMessage = useMemo(() => buildCivicLisaOpening(requests), [requests]);
  const lisaContextKey = useMemo(
    () => `${selected.id}|${requests.map((request) => `${request.id}:${request.stage}:${request.assignee}:${request.due}`).join("|")}`,
    [requests, selected.id],
  );

  function handleLisaNavigation(actionId: string) {
    if (actionId.startsWith("filter:")) {
      setQueueFilter(actionId.slice(7) as QueueFilter);
      setLisaOpen(false);
      return;
    }
    if (actionId.startsWith("request:")) {
      const requestId = actionId.slice(8);
      if (requests.some((request) => request.id === requestId)) {
        setQueueFilter("all");
        setSelectedId(requestId);
      }
      setLisaOpen(false);
    }
  }

  return (
    <>
    <main className="min-h-dvh bg-[#edf2e8] text-[#163a35]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1920px] flex-col px-3 sm:px-5 lg:px-6">
        <header className="flex flex-col gap-4 border-b border-[#cad9cf] py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex shrink-0 items-center gap-3">
              <Image
                src="/municipal/elliniko-argyroupoli-mark.png"
                alt="Σήμα Δήμου Ελληνικού Αργυρούπολης"
                width={64}
                height={64}
                className="size-14 object-contain"
                priority
              />
              <div className="max-w-36 leading-tight">
                <p className="text-xs font-black uppercase text-[#123c36]">Δήμος Ελληνικού-Αργυρούπολης</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.05em] text-[#087ba8]">Εσωτερική πύλη</p>
              </div>
            </div>
            <div className="min-w-0 border-[#cad9cf] sm:border-l sm:pl-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-[#087ba8]">
                <RadioTower className="size-4" aria-hidden="true" />
                Δημοτική διαχείριση
              </p>
              <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">Κέντρο διαχείρισης αιτημάτων</h1>
              <p className="mt-1 text-sm font-semibold text-[#64716b]">Παρακολούθηση, ανάθεση και ολοκλήρωση εργασιών πόλης.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 lg:justify-end">
            <div className="flex items-center divide-x divide-[#cad9cf]">
              {[
                ["Ανοιχτά", summary.open, "text-[#123c36]"],
                ["Άμεσα", summary.urgent, "text-[#b42318]"],
                ["Στο πεδίο", summary.field, "text-[#087ba8]"],
                ["Κλειστά", summary.done, "text-[#27775f]"],
              ].filter(([, value]) => Number(value) > 0).map(([label, value, tone]) => (
                <div key={label as string} className="px-4 first:pl-0 last:pr-0">
                  <p className={`font-mono text-xl font-black tabular-nums ${tone}`}>{value}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.06em] text-[#65716a]">{label}</p>
                </div>
              ))}
            </div>
            <PortalReturnLink />
          </div>
        </header>

        <section className="grid flex-1 gap-3 py-3 xl:grid-cols-[340px_minmax(520px,1fr)_420px]">
          <aside className="min-h-0 overflow-hidden rounded-sm border border-[#cad9cf] bg-[#fbfcf9] xl:h-[calc(100dvh-7.25rem)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#d8e1da] px-4 py-3.5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#008f9a]">Εισερχόμενα</p>
                <h2 className="mt-1 text-xl font-black">Αιτήματα</h2>
              </div>
              <span className="font-mono text-sm font-black tabular-nums text-[#64716b]">{filteredRequests.length}</span>
            </div>

            <div className="grid grid-cols-2 gap-1 border-b border-[#d8e1da] p-2" aria-label="Φίλτρα αιτημάτων">
              {[
                ["all", "Όλα", summary.open],
                ["urgent", "Άμεσα", summary.urgent],
                ["unassigned", "Χωρίς ανάθεση", requests.filter((request) => request.assignee === "Δεν ανατέθηκε" && request.stage !== "done").length],
                ["field", "Στο πεδίο", summary.field],
              ].map(([id, label, count]) => (
                <button
                  key={id as string}
                  type="button"
                  onClick={() => setQueueFilter(id as QueueFilter)}
                  className={`rounded-sm px-2.5 py-2 text-xs font-black transition ${
                    queueFilter === id ? "bg-[#123c36] text-white" : "text-[#5f7069] hover:bg-[#edf4ef]"
                  }`}
                >
                  {label} {count}
                </button>
              ))}
            </div>

            <div className="max-h-[34rem] min-h-[260px] overflow-y-auto xl:h-[calc(100%_-_7.75rem)] xl:max-h-none">
              {filteredRequests.length ? filteredRequests.map((request) => {
                const item = categories[request.category];
                const Icon = item.icon;
                const active = selected.id === request.id;
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedId(request.id)}
                    className={`w-full border-b border-[#e1e8e3] px-4 py-3.5 text-left transition ${
                      active ? "bg-[#e8f3ef]" : "bg-[#fbfcf9] hover:bg-[#f1f6f2]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon className="size-4 shrink-0 text-[#008f9a]" aria-hidden="true" />
                        <span className="text-[11px] font-black uppercase tracking-[0.06em] text-[#087ba8]">{request.id}</span>
                      </div>
                      <span className={`shrink-0 text-[11px] font-black ${request.urgent ? "text-[#b42318]" : "text-[#65716a]"}`}>
                        {requestPriority(request)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-[0.95rem] font-black leading-snug text-[#163a35]">{request.title}</h3>
                    <p className="mt-1 text-xs font-semibold text-[#64716b]">{request.address} · {request.ward}</p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.05em] text-[#8a9792]">Κατάσταση</p>
                        <p className="mt-0.5 text-xs font-black text-[#42534c]">{stageCopy[request.stage].title}</p>
                      </div>
                      <p className="text-xs font-black text-[#42534c]">{request.due}</p>
                    </div>
                  </button>
                );
              }) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-black text-[#42534c]">Δεν υπάρχουν αιτήματα σε αυτό το φίλτρο.</p>
                </div>
              )}
            </div>
          </aside>

          <section className="relative min-h-[540px] overflow-hidden rounded-sm border border-[#cad9cf] bg-[#d8e4df] xl:h-[calc(100dvh-7.25rem)]">
            <iframe
              title="Χάρτης ενεργών αιτημάτων"
              src={googleMapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0 grayscale-[0.15] contrast-[1.02] saturate-[0.78]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[#123c36]/[0.06]" />

            <div className="absolute left-3 right-3 top-3 z-30 flex items-center justify-between gap-3 rounded-sm border border-white/75 bg-white/90 px-3 py-2.5 shadow-[0_8px_24px_rgba(18,60,54,0.08)] backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#008f9a]">Ζωντανή εικόνα</p>
                <h2 className="mt-0.5 text-sm font-black text-[#163a35] sm:text-base">Χάρτης αιτημάτων</h2>
              </div>
              <p className="text-xs font-black text-[#64716b]">{summary.open} ενεργά σημεία</p>
            </div>

            <div className="pointer-events-none absolute inset-0 z-10">
              {hotspots.filter((hotspot) => Math.hypot(hotspot.x - selected.x, hotspot.y - selected.y) > 12).map((hotspot) => (
                <div
                  key={hotspot.id}
                  title={`${hotspot.label}: ${hotspot.count} αιτήματα`}
                  className="absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-[#123c36]/75 text-[10px] font-black text-white shadow-[0_5px_16px_rgba(18,60,54,0.22)]"
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                >
                  {hotspot.count}
                </div>
              ))}
            </div>

            {requests.filter((request) => request.stage !== "done").map((request) => {
              const config = categories[request.category];
              const Icon = config.icon;
              const active = selected.id === request.id;
              return (
                <div
                  key={request.id}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${request.x}%`, top: `${request.y}%` }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(request.id)}
                    className={`grid place-items-center rounded-full border-2 bg-white transition ${
                      active
                        ? "size-11 border-[#123c36] text-[#123c36] shadow-[0_0_0_6px_rgba(18,60,54,0.16)]"
                        : "size-8 border-white text-[#087ba8] shadow-[0_5px_16px_rgba(18,60,54,0.20)] hover:scale-110"
                    }`}
                    aria-label={request.title}
                  >
                    <Icon className={active ? "size-5" : "size-4"} aria-hidden="true" />
                  </button>
                  {active ? (
                    <div className="absolute left-1/2 top-14 w-52 -translate-x-1/2 rounded-sm border border-[#cad9cf] bg-white px-3 py-2 text-left shadow-[0_10px_28px_rgba(18,60,54,0.18)]">
                      <p className="text-sm font-black leading-snug text-[#163a35]">{request.title}</p>
                      <p className="mt-1 text-xs font-semibold text-[#64716b]">{request.address}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>

          <aside className="rounded-sm border border-[#cad9cf] bg-[#fbfcf9] xl:h-[calc(100dvh-7.25rem)] xl:overflow-y-auto">
            <div className="border-b border-[#d8e1da] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.07em] text-[#087ba8]">
                  <SelectedIcon className="size-4" aria-hidden="true" />
                  {selectedCategory.title}
                </div>
                {selected.urgent && selected.stage !== "done" ? (
                  <span className="text-[11px] font-black uppercase text-[#b42318]">Άμεσο</span>
                ) : null}
              </div>
              <h2 className="mt-3 text-2xl font-black leading-tight text-[#163a35]">{selected.title}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#64716b]">
                <MapPin className="size-4 shrink-0 text-[#008f9a]" aria-hidden="true" />
                {selected.address} · {selected.ward}
              </p>
            </div>

            <div className="border-b border-[#d8e1da] px-5 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.07em] text-[#65716b]">Πορεία αιτήματος</p>
              <div className="mt-4 grid grid-cols-4">
                {workflowStages.map((stage, index) => {
                  const passed = workflowIndex > index;
                  const current = workflowIndex === index;
                  return (
                    <div key={stage} className="min-w-0">
                      <div className="flex items-center">
                        <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-black ${
                          passed
                            ? "border-[#27775f] bg-[#27775f] text-white"
                            : current
                              ? "border-[#123c36] bg-white text-[#123c36]"
                              : "border-[#cbd6d0] bg-white text-[#8a9792]"
                        }`}>
                          {passed ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : index + 1}
                        </span>
                        {index < workflowStages.length - 1 ? (
                          <span className={`h-px flex-1 ${passed ? "bg-[#27775f]" : "bg-[#d8e1da]"}`} />
                        ) : null}
                      </div>
                      <p className={`mt-2 pr-1 text-[10px] font-black leading-tight ${current ? "text-[#123c36]" : "text-[#7b8983]"}`}>
                        {stageCopy[stage].title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <section className="border-b border-[#d8e1da] px-5 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.07em] text-[#65716b]">Περιγραφή</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#42534c]">{selected.note}</p>
              <button type="button" className="mt-3 inline-flex items-center gap-2 text-xs font-black text-[#087ba8] hover:text-[#075f82]">
                <Camera className="size-4" aria-hidden="true" />
                {selected.photoLabel}
              </button>
            </section>

            <section className="border-b border-[#d8e1da] px-5 py-2">
              <dl className="divide-y divide-[#e1e8e3]">
                {[
                  ["Υπηρεσία", selected.department],
                  ["Υπεύθυνος", selected.assignee],
                  ["Όχημα", selected.vehicle],
                  ["Προθεσμία", selected.due],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                    <dt className="text-[10px] font-black uppercase tracking-[0.06em] text-[#7b8983]">{label}</dt>
                    <dd className="text-sm font-black leading-5 text-[#273b35]">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="border-b border-[#d8e1da] px-5 py-4">
              <div className="flex items-start gap-3">
                <MessageSquareText className="mt-0.5 size-4 shrink-0 text-[#008f9a]" aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.07em] text-[#65716b]">
                    {selected.stage === "done" ? "Σημείωση ολοκλήρωσης" : "Τελευταία ενημέρωση"}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#53645d]">{selected.response}</p>
                </div>
              </div>
            </section>

            <div className="px-5 py-4">
              {primaryAction ? (
                <button
                  type="button"
                  onClick={primaryAction.run}
                  className="flex min-h-11 w-full items-center justify-between rounded-sm bg-[#123c36] px-4 text-sm font-black text-white transition hover:bg-[#174a42] active:translate-y-px"
                >
                  {primaryAction.label}
                  <primaryAction.icon className="size-4" aria-hidden="true" />
                </button>
              ) : (
                <div className="flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[#b9d8ca] bg-[#edf7f1] px-4 text-sm font-black text-[#27775f]">
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  Το αίτημα ολοκληρώθηκε
                </div>
              )}
              <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#7b8983]">
                <Clock3 className="size-3.5 text-[#008f9a]" aria-hidden="true" />
                Τελευταία κίνηση: {stageCopy[selected.stage].title}
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-[60] bg-[#062321]/20 backdrop-blur-[1px] transition-opacity duration-200 ${
          lisaOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <MunicipalLisaAssistant
        open={lisaOpen}
        onClose={() => setLisaOpen(false)}
        onToggle={() => setLisaOpen((open) => !open)}
        contextKey={lisaContextKey}
        appLabel="Βοηθός Δημοτικής Πύλης"
        description="Σας δείχνει τι προέχει και πού να πάτε."
        openingMessage={lisaOpeningMessage}
        quickPrompts={civicLisaPrompts}
        resolvePrompt={(intent) => resolveCivicLisaIntent(intent as Parameters<typeof resolveCivicLisaIntent>[0], requests, selected)}
        resolveFreeText={(value) => resolveCivicLisaIntent(parseCivicLisaIntent(value), requests, selected)}
        onNavigate={handleLisaNavigation}
      />
    </>
  );
}
