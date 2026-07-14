export type DemoRequest = {
  name: string;
  company: string;
  email: string;
  phone: string | null;
  role: string;
  fleetSize: string;
  challenge: string;
  honeypot: string;
  source: string | null;
};

export type DemoRequestValidation = {
  request: DemoRequest;
  errors: Record<string, string>;
  valid: boolean;
};

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export function validateDemoRequest(value: unknown): DemoRequestValidation {
  const payload = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const request: DemoRequest = {
    name: text(payload.name, 120),
    company: text(payload.company, 160),
    email: text(payload.email, 200).toLowerCase(),
    phone: text(payload.phone, 60) || null,
    role: text(payload.role, 100),
    fleetSize: text(payload.fleetSize, 80),
    challenge: text(payload.challenge, 1200),
    honeypot: text(payload.honeypot, 200),
    source: text(payload.source, 300) || null,
  };

  const errors: Record<string, string> = {};
  if (!request.name) errors.name = "Enter your name.";
  if (!request.company) errors.company = "Enter your company.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) errors.email = "Enter a valid work email.";
  if (!request.role) errors.role = "Select your role.";
  if (!request.fleetSize) errors.fleetSize = "Select a fleet size.";
  if (!request.challenge) errors.challenge = "Tell us what you need to prevent.";

  return { request, errors, valid: Object.keys(errors).length === 0 };
}
