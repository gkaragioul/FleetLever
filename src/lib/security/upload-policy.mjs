const formats = [
  {
    extensions: [".pdf"],
    mimeType: "application/pdf",
    signature: (bytes) => bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-",
  },
  {
    extensions: [".jpg", ".jpeg"],
    mimeType: "image/jpeg",
    signature: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    extensions: [".png"],
    mimeType: "image/png",
    signature: (bytes) =>
      bytes.length >= 8 &&
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value),
  },
  {
    extensions: [".webp"],
    mimeType: "image/webp",
    signature: (bytes) =>
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
  },
];

export function validateUpload({ fileName, declaredMimeType, bytes }) {
  const dotIndex = fileName.lastIndexOf(".");
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
  const format = formats.find((candidate) => candidate.extensions.includes(extension));

  if (!format) throw new Error("This file type is not supported. Upload a PDF, JPEG, PNG, or WebP file.");
  if (declaredMimeType.toLowerCase() !== format.mimeType) {
    throw new Error("The declared file type does not match the file extension.");
  }
  if (!format.signature(bytes)) throw new Error("The file content does not match its declared type.");

  return {
    extension: format.extensions[0],
    mimeType: format.mimeType,
  };
}
