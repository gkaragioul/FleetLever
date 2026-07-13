import type { MunicipalLisaMessage, MunicipalLisaPrompt } from "@/components/fleetlever/municipal-lisa-assistant";

export type CivicLisaRequest = {
  id: string;
  title: string;
  stage: "citizen" | "triage" | "department" | "field" | "done";
  assignee: string;
  due: string;
  urgent: boolean;
  department: string;
};

export type CivicLisaIntent =
  | "queue-summary"
  | "next-request"
  | "urgent"
  | "unassigned"
  | "delayed"
  | "field"
  | "selected-request"
  | "capabilities";

export const civicLisaPrompts: MunicipalLisaPrompt[] = [
  { id: "next-request", label: "Τι προέχει;" },
  { id: "urgent", label: "Άμεσα αιτήματα" },
  { id: "unassigned", label: "Χωρίς ανάθεση" },
  { id: "field", label: "Εργασίες στο πεδίο" },
];

function activeRequests(requests: CivicLisaRequest[]) {
  return requests.filter((request) => request.stage !== "done");
}

function isUnassigned(request: CivicLisaRequest) {
  return request.assignee === "Δεν ανατέθηκε";
}

function needsTimeAttention(request: CivicLisaRequest) {
  const due = normalize(request.due);
  return due.includes("σημερα") || due.includes("χρειαζεται") || due.includes("εκπροθεσ");
}

function priorityScore(request: CivicLisaRequest) {
  if (request.urgent && isUnassigned(request)) return 0;
  if (request.urgent) return 1;
  if (isUnassigned(request)) return 2;
  if (needsTimeAttention(request)) return 3;
  if (request.stage === "field") return 4;
  return 5;
}

export function rankCivicRequests(requests: CivicLisaRequest[]) {
  return activeRequests(requests)
    .map((request, index) => ({ request, index }))
    .sort((a, b) => priorityScore(a.request) - priorityScore(b.request) || a.index - b.index)
    .map(({ request }) => request);
}

export function buildCivicLisaOpening(requests: CivicLisaRequest[]): MunicipalLisaMessage {
  const active = activeRequests(requests);
  const urgent = active.filter((request) => request.urgent);
  const unassigned = active.filter(isUnassigned);
  const field = active.filter((request) => request.stage === "field");
  const next = rankCivicRequests(active)[0];

  if (!active.length) {
    return {
      id: "civic-opening",
      role: "lisa",
      text: "Δεν υπάρχουν ανοιχτά αιτήματα αυτή τη στιγμή.",
      bullets: ["Η ουρά είναι καθαρή."],
    };
  }

  return {
    id: "civic-opening",
    role: "lisa",
    text: `Βλέπω ${active.length} ενεργά αιτήματα. ${urgent.length ? `${urgent.length} ${urgent.length === 1 ? "είναι άμεσο" : "είναι άμεσα"}` : "Κανένα δεν είναι άμεσο"}.`,
    bullets: [
      `${unassigned.length} χωρίς ανάθεση`,
      `${field.length} ${field.length === 1 ? "εργασία βρίσκεται" : "εργασίες βρίσκονται"} στο πεδίο`,
      next ? `Πρώτη προτεραιότητα: ${next.id} · ${next.title}` : "Δεν απαιτείται άμεση κίνηση",
    ],
    action: next
      ? { id: `request:${next.id}`, label: `Προβολή ${next.id}`, tone: next.urgent ? "attention" : "neutral" }
      : undefined,
  };
}

export function resolveCivicLisaIntent(
  intent: CivicLisaIntent,
  requests: CivicLisaRequest[],
  selected: CivicLisaRequest,
): MunicipalLisaMessage {
  const active = activeRequests(requests);
  const ranked = rankCivicRequests(active);
  const urgent = ranked.filter((request) => request.urgent);
  const unassigned = ranked.filter(isUnassigned);
  const field = ranked.filter((request) => request.stage === "field");
  const delayed = ranked.filter(needsTimeAttention);

  if (intent === "queue-summary") return buildCivicLisaOpening(requests);

  if (intent === "next-request") {
    const next = ranked[0];
    return next
      ? {
          id: "civic-next",
          role: "lisa",
          text: `Θα ξεκινούσα από το ${next.id}: ${next.title}.`,
          bullets: [
            next.urgent ? "Έχει δηλωθεί ως άμεσο." : "Είναι η υψηλότερη εκκρεμότητα στην ουρά.",
            isUnassigned(next) ? "Δεν έχει ακόμη υπεύθυνο." : `Υπεύθυνος: ${next.assignee}.`,
            `Προθεσμία: ${next.due}.`,
          ],
          action: { id: `request:${next.id}`, label: `Προβολή ${next.id}`, tone: next.urgent ? "attention" : "neutral" },
        }
      : emptyQueueMessage();
  }

  if (intent === "urgent") {
    return collectionMessage(
      urgent,
      urgent.length ? `${urgent.length} ${urgent.length === 1 ? "άμεσο αίτημα χρειάζεται" : "άμεσα αιτήματα χρειάζονται"} προσοχή.` : "Δεν υπάρχει άμεσο αίτημα στην ουρά.",
      "filter:urgent",
      "Προβολή άμεσων",
    );
  }

  if (intent === "unassigned") {
    return collectionMessage(
      unassigned,
      unassigned.length ? `${unassigned.length} αιτήματα χωρίς ανάθεση.` : "Όλα τα ενεργά αιτήματα έχουν υπεύθυνο.",
      "filter:unassigned",
      "Προβολή χωρίς ανάθεση",
    );
  }

  if (intent === "field") {
    return collectionMessage(
      field,
      field.length ? `${field.length} ${field.length === 1 ? "εργασία είναι" : "εργασίες είναι"} στο πεδίο.` : "Δεν υπάρχει εργασία στο πεδίο αυτή τη στιγμή.",
      "filter:field",
      "Προβολή εργασιών πεδίου",
    );
  }

  if (intent === "delayed") {
    const first = delayed[0];
    return first
      ? {
          id: "civic-delayed",
          role: "lisa",
          text: `${delayed.length} ${delayed.length === 1 ? "αίτημα θέλει" : "αιτήματα θέλουν"} χρονική προσοχή.`,
          bullets: delayed.slice(0, 3).map((request) => `${request.id}: ${request.due} · ${request.title}`),
          action: { id: `request:${first.id}`, label: `Προβολή ${first.id}`, tone: first.urgent ? "attention" : "neutral" },
        }
      : {
          id: "civic-delayed-empty",
          role: "lisa",
          text: "Δεν βλέπω αίτημα με άμεση χρονική εκκρεμότητα.",
        };
  }

  if (intent === "selected-request") {
    return {
      id: "civic-selected",
      role: "lisa",
      text: `${selected.id}: ${selected.title}.`,
      bullets: [
        selected.stage === "triage" || selected.stage === "citizen"
          ? "Πρόταση: επιβεβαίωση στοιχείων και ανάθεση στην αρμόδια υπηρεσία."
          : selected.stage === "department"
            ? "Πρόταση: επιβεβαίωση υπευθύνου και χρόνου πριν σταλεί στο πεδίο."
            : selected.stage === "field"
              ? "Πρόταση: παρακολούθηση της εργασίας και τεκμηρίωση πριν την ολοκλήρωση."
              : "Το αίτημα έχει ολοκληρωθεί.",
        `Υπηρεσία: ${selected.department}.`,
        `Υπεύθυνος: ${selected.assignee}.`,
      ],
      action: { id: `request:${selected.id}`, label: `Προβολή ${selected.id}`, tone: selected.urgent ? "attention" : "neutral" },
    };
  }

  return {
    id: "civic-capabilities",
    role: "lisa",
    text: "Μπορώ να σας δείξω τι προέχει, τα άμεσα ή χωρίς ανάθεση αιτήματα, τις καθυστερήσεις και τις εργασίες στο πεδίο.",
    bullets: ["Δεν κάνω αναθέσεις ή αλλαγές κατάστασης."],
  };
}

export function parseCivicLisaIntent(value: string): CivicLisaIntent {
  const text = normalize(value);
  if (text.includes("χωρις αναθεση") || text.includes("ανατεθει")) return "unassigned";
  if (text.includes("αμεσ") || text.includes("επειγον")) return "urgent";
  if (text.includes("καθυστερ") || text.includes("προθεσμ") || text.includes("αργ")) return "delayed";
  if (text.includes("πεδιο") || text.includes("συνεργει")) return "field";
  if (text.includes("αυτο") || text.includes("επιλεγ") || text.includes("αιτημα")) return "selected-request";
  if (text.includes("επομε") || text.includes("προεχει") || text.includes("πρωτα")) return "next-request";
  if (text.includes("ουρα") || text.includes("συνοψ") || text.includes("εικονα")) return "queue-summary";
  return "capabilities";
}

function collectionMessage(
  items: CivicLisaRequest[],
  text: string,
  actionId: string,
  actionLabel: string,
): MunicipalLisaMessage {
  return {
    id: `civic-${actionId}`,
    role: "lisa",
    text,
    bullets: items.slice(0, 3).map((request) => `${request.id}: ${request.title}`),
    action: items.length ? { id: actionId, label: actionLabel, tone: items.some((request) => request.urgent) ? "attention" : "neutral" } : undefined,
  };
}

function emptyQueueMessage(): MunicipalLisaMessage {
  return {
    id: "civic-empty",
    role: "lisa",
    text: "Δεν υπάρχει ανοιχτό αίτημα που να χρειάζεται ενέργεια.",
  };
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("el-GR");
}
