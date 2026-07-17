import assert from "node:assert/strict";
import test from "node:test";

import { validateUpload } from "../src/lib/security/upload-policy.mjs";

const pngBytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const pdfBytes = new TextEncoder().encode("%PDF-1.7\n");
const webpBytes = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

test("accepts only supported evidence formats with matching signatures", () => {
  assert.deepEqual(validateUpload({ fileName: "inspection.png", declaredMimeType: "image/png", bytes: pngBytes }), {
    extension: ".png",
    mimeType: "image/png",
  });
  assert.deepEqual(validateUpload({ fileName: "photo.JPG", declaredMimeType: "image/jpeg", bytes: jpegBytes }), {
    extension: ".jpg",
    mimeType: "image/jpeg",
  });
  assert.deepEqual(validateUpload({ fileName: "certificate.pdf", declaredMimeType: "application/pdf", bytes: pdfBytes }), {
    extension: ".pdf",
    mimeType: "application/pdf",
  });
  assert.deepEqual(validateUpload({ fileName: "evidence.webp", declaredMimeType: "image/webp", bytes: webpBytes }), {
    extension: ".webp",
    mimeType: "image/webp",
  });
});

test("rejects executable and mismatched uploads even when the browser MIME type is forged", () => {
  assert.throws(
    () => validateUpload({ fileName: "invoice.pdf.exe", declaredMimeType: "application/pdf", bytes: pdfBytes }),
    /file type is not supported/i,
  );
  assert.throws(
    () => validateUpload({ fileName: "certificate.pdf", declaredMimeType: "application/pdf", bytes: pngBytes }),
    /content does not match/i,
  );
  assert.throws(
    () => validateUpload({ fileName: "photo.png", declaredMimeType: "image/jpeg", bytes: pngBytes }),
    /declared file type does not match/i,
  );
  assert.throws(
    () => validateUpload({ fileName: "payload.svg", declaredMimeType: "image/svg+xml", bytes: new TextEncoder().encode("<svg/>") }),
    /file type is not supported/i,
  );
});
