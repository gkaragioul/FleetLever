import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ImcPhotoFile = {
  mediumUrl?: unknown;
  thumbnailUrl?: unknown;
  url?: unknown;
};

type ImcIssuePayload = {
  id?: unknown;
  title?: unknown;
  step?: {
    title?: unknown;
    stepcolor?: unknown;
  };
  category?: {
    title?: unknown;
  };
  address?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  created?: unknown;
  updated?: unknown;
  description?: unknown;
  photo?: {
    files?: unknown;
  };
};

const sourceHost = "https://imc.thessaloniki.gr";

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function extractIssueId(value: string | null) {
  if (!value) return null;
  const match = value.match(/(?:issue\/|id=)?(\d{3,})/);
  return match?.[1] ?? null;
}

function publicImageUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${sourceHost}${value}`;
  return `${sourceHost}/${value}`;
}

function firstPhotoUrl(photo: ImcIssuePayload["photo"]) {
  const files = Array.isArray(photo?.files) ? (photo.files as ImcPhotoFile[]) : [];
  const first = files[0];
  if (!first) return null;
  return publicImageUrl(first.mediumUrl ?? first.thumbnailUrl ?? first.url);
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

export async function GET(request: NextRequest) {
  const issueId = extractIssueId(request.nextUrl.searchParams.get("issue"));

  if (!issueId) {
    return noStoreJson({ error: "Provide a public IMC issue URL or numeric issue ID." }, { status: 400 });
  }

  const response = await fetch(`${sourceHost}/api/imc/issue?id=${issueId}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "FleetLever external-blockers prototype",
    },
  });

  if (!response.ok) {
    return noStoreJson(
      { error: `Unable to read public issue ${issueId}.`, status: response.status },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as ImcIssuePayload;
  const id = typeof payload.id === "number" ? payload.id : Number(issueId);

  return noStoreJson({
    id: `imc-${id}`,
    source: "Thessaloniki IMC",
    sourceId: String(id),
    sourceUrl: `${sourceHost}/imc/issue/${id}`,
    title: readString(payload.title, `Municipal issue #${id}`),
    status: readString(payload.step?.title, "Published"),
    statusColor: readString(payload.step?.stepcolor, "#64748b"),
    category: readString(payload.category?.title, "Municipal issue"),
    address: readString(payload.address, "No address supplied"),
    latitude: readNumber(payload.latitude),
    longitude: readNumber(payload.longitude),
    createdAt: readString(payload.created),
    updatedAt: readString(payload.updated),
    description: readString(payload.description),
    photoUrl: firstPhotoUrl(payload.photo),
  });
}
