import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type StoredObject = {
  storageKey: string;
  storageProvider: "railway-bucket" | "local-file";
  storageBucket: string | null;
  sha256: string;
};

type UploadInput = {
  key: string;
  body: Buffer;
  contentType: string;
  fileName?: string;
};

type BucketConfig = {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
};

const isProductionDeployment = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);

function bucketConfig(): BucketConfig | null {
  const bucket = process.env.FLEETLEVER_BUCKET_NAME ?? process.env.RAILWAY_BUCKET_NAME ?? process.env.AWS_S3_BUCKET ?? process.env.S3_BUCKET_NAME;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.AWS_ENDPOINT_URL ?? process.env.S3_ENDPOINT ?? process.env.RAILWAY_BUCKET_ENDPOINT;

  if (!bucket || !accessKeyId || !secretAccessKey) return null;
  if (isProductionDeployment && !endpoint) return null;

  return {
    bucket,
    region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? process.env.S3_REGION ?? "auto",
    endpoint,
    accessKeyId,
    secretAccessKey,
  };
}

function s3Client(config: BucketConfig) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function localUploadPath(key: string) {
  return path.join(process.cwd(), ".fleetlever", "uploads", ...key.split("/").filter(Boolean));
}

function sha256(body: Buffer) {
  return createHash("sha256").update(body).digest("hex");
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body === "object" && "transformToByteArray" in body && typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }

  const stream = body as AsyncIterable<Uint8Array>;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function requireObjectStorageForProduction() {
  if (!isProductionDeployment || bucketConfig()) return null;

  return {
    ok: false,
    message: "Railway Bucket storage is not configured. Add bucket variables before uploading production files.",
  };
}

export function objectStorageHealth() {
  const config = bucketConfig();

  return {
    configured: Boolean(config),
    required: isProductionDeployment,
    provider: config ? "railway-bucket" : isProductionDeployment ? null : "local-file",
    bucket: config?.bucket ?? null,
    endpointConfigured: Boolean(config?.endpoint),
  };
}

export async function uploadObject(input: UploadInput): Promise<StoredObject> {
  const digest = sha256(input.body);
  const config = bucketConfig();

  if (config) {
    await s3Client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        Metadata: {
          sha256: digest,
          ...(input.fileName ? { filename: input.fileName } : {}),
        },
      }),
    );

    return {
      storageKey: input.key,
      storageProvider: "railway-bucket",
      storageBucket: config.bucket,
      sha256: digest,
    };
  }

  if (isProductionDeployment) {
    throw new Error("Railway Bucket storage is not configured.");
  }

  const filePath = localUploadPath(input.key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, input.body);

  return {
    storageKey: input.key,
    storageProvider: "local-file",
    storageBucket: null,
    sha256: digest,
  };
}

export async function readObject(storageKey: string, storageProvider: string, storageBucket?: string | null) {
  if (storageProvider === "railway-bucket") {
    const config = bucketConfig();
    if (!config) throw new Error("Railway Bucket storage is not configured.");

    const result = await s3Client(config).send(
      new GetObjectCommand({
        Bucket: storageBucket ?? config.bucket,
        Key: storageKey,
      }),
    );

    return bodyToBuffer(result.Body);
  }

  if (storageProvider === "local-file") {
    return readFile(localUploadPath(storageKey));
  }

  throw new Error(`Unsupported storage provider: ${storageProvider}`);
}
