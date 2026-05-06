import { useState } from "react";
import { Dialog, DialogContent } from "./dialog";
import { FileImage, FileText, FileAudio, Film, ScrollText, MessageSquare, Scale, Globe, File } from "lucide-react";

interface EvidenceItem {
  id: number;
  fileName: string;
  fileUrl?: string | null;
  filePath?: string | null;
  storageType: string;
  evidenceType: string;
  description?: string | null;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  screenshot: <FileImage className="h-5 w-5" />,
  video_clip: <Film className="h-5 w-5" />,
  full_video: <Film className="h-5 w-5" />,
  audio_recording: <FileAudio className="h-5 w-5" />,
  transcript: <ScrollText className="h-5 w-5" />,
  chat_log: <MessageSquare className="h-5 w-5" />,
  court_document: <Scale className="h-5 w-5" />,
  social_media_post: <Globe className="h-5 w-5" />,
};

function getSrc(item: EvidenceItem): string | null {
  if (item.storageType === "upload" && item.filePath) return item.filePath;
  if (item.fileUrl) return item.fileUrl;
  return null;
}

function isImage(item: EvidenceItem): boolean {
  const src = getSrc(item);
  if (!src) return false;
  return item.evidenceType === "screenshot" ||
    src.endsWith(".png") || src.endsWith(".jpg") || src.endsWith(".jpeg") || src.endsWith(".webp");
}

function isPdf(item: EvidenceItem): boolean {
  return item.fileName.toLowerCase().endsWith(".pdf") || (item.fileUrl?.toLowerCase().endsWith(".pdf") ?? false);
}

interface EvidencePreviewProps {
  item: EvidenceItem;
  size?: "sm" | "md" | "lg";
}

export function EvidencePreview({ item, size = "md" }: EvidencePreviewProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const src = getSrc(item);

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  // Image: show actual thumbnail
  if (isImage(item) && src) {
    return (
      <>
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-secondary shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all`}
        >
          <img
            src={src}
            alt={item.fileName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </button>
        {viewerOpen && <EvidenceViewer item={item} open={viewerOpen} onClose={() => setViewerOpen(false)} />}
      </>
    );
  }

  // PDF: show PDF icon card
  if (isPdf(item)) {
    return (
      <>
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className={`${sizeClasses[size]} rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-red-400/50 transition-all`}
        >
          <div className="text-center">
            <FileText className={`${iconSizeClasses[size]} text-red-500 mx-auto`} />
            {size === "lg" && <span className="text-[9px] text-red-500 font-medium mt-0.5 block">PDF</span>}
          </div>
        </button>
        {viewerOpen && <EvidenceViewer item={item} open={viewerOpen} onClose={() => setViewerOpen(false)} />}
      </>
    );
  }

  // Everything else: type-based icon
  const typeIcon = TYPE_ICONS[item.evidenceType] || <File className={iconSizeClasses[size]} />;
  return (
    <>
      <button
        type="button"
        onClick={() => setViewerOpen(true)}
        className={`${sizeClasses[size]} rounded-lg bg-secondary flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all`}
      >
        <span className="text-muted-foreground">{typeIcon}</span>
      </button>
      {viewerOpen && <EvidenceViewer item={item} open={viewerOpen} onClose={() => setViewerOpen(false)} />}
    </>
  );
}

// Full-size viewer modal
export function EvidenceViewer({ item, open, onClose }: { item: EvidenceItem; open: boolean; onClose: () => void }) {
  const src = getSrc(item);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-4 border-b">
          <p className="font-semibold text-sm">{item.fileName}</p>
          <p className="text-xs text-muted-foreground">{item.evidenceType.replace("_", " ")}</p>
        </div>

        <div className="p-4 flex items-center justify-center bg-black/5 dark:bg-white/5 min-h-[200px]">
          {isImage(item) && src ? (
            <img src={src} alt={item.fileName} className="max-w-full max-h-[60vh] object-contain rounded-md" />
          ) : isPdf(item) && src ? (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-center gap-3 py-8">
                <FileText className="h-12 w-12 text-red-500" />
                <div>
                  <p className="font-medium">{item.fileName}</p>
                  <p className="text-xs text-muted-foreground">PDF Document</p>
                </div>
              </div>
              <div className="flex justify-center">
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Open PDF
                </a>
              </div>
            </div>
          ) : src ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Open File
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No file available.</p>
          )}
        </div>

        {item.description && (
          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { isImage, isPdf, getSrc };
export type { EvidenceItem };
