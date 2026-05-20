import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./env";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getDb } from "./connection";
import { intakeQueue } from "./schema";

// Lazy-load pdf-parse to avoid startup issues
let pdfParse: any = null;
async function getPdfParse() {
  if (!pdfParse) {
    pdfParse = await import("pdf-parse").then(m => m.default || m);
  }
  return pdfParse;
}

const app = new Hono<{ Bindings: HttpBindings }>();

// ─── FILE UPLOADS ──────────────────────────────────────────────
// Use UPLOAD_DIR env var for deployed environments (Render, Railway, etc.)
// Falls back to local ../uploads for development
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(import.meta.dirname, "../uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Upload endpoint — accepts multipart form data
app.post("/api/upload", bodyLimit({ maxSize: 10 * 1024 * 1024 }), async (c) => {
  try {
    const body = await c.req.parseBody({ all: false });
    const file = body.file;

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file provided" }, 400);
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: `File type not allowed: ${file.type}. Allowed: PDF, PNG, JPG, JPEG, WEBP` }, 400);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return c.json({ error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB` }, 400);
    }

    const ext = path.extname(file.name) || ".bin";
    const hash = crypto.randomBytes(8).toString("hex");
    const safeName = `${Date.now()}-${hash}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return c.json({
      success: true,
      fileName: file.name,
      storedName: safeName,
      filePath: `/api/files/${safeName}`,
      size: file.size,
      type: file.type,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return c.json({ error: "Upload failed: " + (err.message || "Unknown error") }, 500);
  }
});

// ─── BULK INTAKE UPLOAD ────────────────────────────────────────
// Accepts multiple files, stores them, extracts text, queues for review
app.post("/api/intake/bulk", bodyLimit({ maxSize: 100 * 1024 * 1024 }), async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });
    const filesRaw = body.files;
    if (!filesRaw) {
      return c.json({ error: "No files provided" }, 400);
    }

    // Normalize to array (filter out any non-File entries)
    const files: File[] = (Array.isArray(filesRaw) ? filesRaw : [filesRaw]).filter(
      (f): f is File => f instanceof File
    );
    const allowedExts = [".pdf", ".txt", ".csv", ".png", ".jpg", ".jpeg", ".webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB per file

    const results: Array<{
      success: boolean;
      originalName: string;
      storedName?: string;
      filePath?: string;
      size?: number;
      hash?: string;
      extractedText?: string | null;
      isImagePdf?: boolean;
      error?: string;
      duplicateOf?: number | null;
    }> = [];

    const db = getDb();

    // Check existing hashes for dedup
    const existingItems = await db.select({
      fileHash: intakeQueue.fileHash,
      id: intakeQueue.id,
      originalFilename: intakeQueue.originalFilename,
    }).from(intakeQueue);
    const hashMap = new Map(existingItems.map(i => [i.fileHash, i.id]));

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const ext = path.extname(file.name).toLowerCase();
      if (!allowedExts.includes(ext)) {
        results.push({ success: false, originalName: file.name, error: `Type not allowed: ${ext}` });
        continue;
      }
      if (file.size > maxSize) {
        results.push({ success: false, originalName: file.name, error: `Too large: ${(file.size/1024/1024).toFixed(1)}MB` });
        continue;
      }

      // Compute hash
      const buffer = Buffer.from(await file.arrayBuffer());
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");

      // Check duplicate
      const dupId = hashMap.get(hash);
      if (dupId) {
        results.push({ success: false, originalName: file.name, hash, duplicateOf: dupId, error: "Duplicate file" });
        continue;
      }

      // Store file
      const safeHash = crypto.randomBytes(8).toString("hex");
      const safeName = `${Date.now()}-${safeHash}${ext}`;
      const filePath = path.join(UPLOAD_DIR, safeName);
      fs.writeFileSync(filePath, buffer);

      // Extract text
      let extractedText: string | null = null;
      let isImagePdf = false;

      if (ext === ".pdf") {
        try {
          const parsePdf = await getPdfParse();
          const pdfData = await parsePdf(buffer);
          extractedText = pdfData.text?.trim() || null;
          // If no text extracted, likely an image/scanned PDF
          if (!extractedText || extractedText.length < 10) {
            isImagePdf = true;
            extractedText = null;
          }
        } catch (e: any) {
          isImagePdf = true;
          extractedText = null;
        }
      } else if (ext === ".txt" || ext === ".csv") {
        extractedText = buffer.toString("utf-8").trim();
      }

      // Determine mime type
      const mimeTypes: Record<string, string> = {
        ".pdf": "application/pdf", ".txt": "text/plain", ".csv": "text/csv",
        ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
      };

      // Save to intake queue
      await db.insert(intakeQueue).values({
        userId: 1,
        originalFilename: file.name,
        storedFilename: safeName,
        filePath: `/api/files/${safeName}`,
        fileSize: file.size,
        fileHash: hash,
        mimeType: mimeTypes[ext] || "application/octet-stream",
        sourceType: "upload",
        status: "pending",
        extractedText,

        transcriptText: (ext === ".txt" || ext === ".csv") ? extractedText : undefined,
        evidenceType: ext === ".pdf" ? "court_document" : [".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? "screenshot" : "transcript",
      } as any);

      results.push({
        success: true,
        originalName: file.name,
        storedName: safeName,
        filePath: `/api/files/${safeName}`,
        size: file.size,
        hash,
        extractedText,
        isImagePdf,
      });

      // Add to hash map for this batch
      hashMap.set(hash, -1);
    }

    return c.json({
      success: true,
      uploaded: results.filter(r => r.success).length,
      duplicates: results.filter(r => r.duplicateOf).length,
      errors: results.filter(r => r.error && !r.duplicateOf).length,
      results,
    });
  } catch (err: any) {
    console.error("Bulk upload error:", err);
    return c.json({ error: "Upload failed: " + (err.message || "Unknown error") }, 500);
  }
});

// ─── TRANSCRIPT PASTE INTAKE ────────────────────────────────────
app.post("/api/intake/paste", bodyLimit({ maxSize: 5 * 1024 * 1024 }), async (c) => {
  try {
    const body = await c.req.json();
    const { text, title } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return c.json({ error: "Text is required" }, 400);
    }

    const db = getDb();
    const hash = crypto.createHash("sha256").update(text).digest("hex");

    // Store as a text file
    const safeName = `transcript-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.txt`;
    const filePath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(filePath, text, "utf-8");

    await db.insert(intakeQueue).values({
      userId: 1,
      originalFilename: title || "Pasted Transcript",
      storedFilename: safeName,
      filePath: `/api/files/${safeName}`,
      fileSize: Buffer.byteLength(text, "utf-8"),
      fileHash: hash,
      mimeType: "text/plain",
      sourceType: "paste",
      status: "pending",
      transcriptText: text,
      evidenceType: "transcript",
    } as any);

    return c.json({ success: true, message: "Transcript added to intake queue" });
  } catch (err: any) {
    console.error("Paste error:", err);
    return c.json({ error: "Failed: " + (err.message || "Unknown error") }, 500);
  }
});

// File serving endpoint — serves uploaded files
app.get("/api/files/:filename", async (c) => {
  const filename = c.req.param("filename");
  const safeFilename = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  if (!filePath.startsWith(UPLOAD_DIR)) {
    return c.json({ error: "Invalid filename" }, 403);
  }

  if (!fs.existsSync(filePath)) {
    return c.json({ error: "File not found" }, 404);
  }

  const ext = path.extname(safeFilename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };
  const contentType = mimeTypes[ext] || "application/octet-stream";

  const stat = fs.statSync(filePath);
  c.header("Content-Type", contentType);
  c.header("Content-Length", String(stat.size));

  if (contentType.startsWith("image/")) {
    c.header("Content-Disposition", "inline");
  } else {
    c.header("Content-Disposition", `attachment; filename="${safeFilename}"`);
  }

  const stream = fs.createReadStream(filePath);
  return new Response(stream as any, { headers: c.res.headers });
});

// ─── tRPC ──────────────────────────────────────────────────────
app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
