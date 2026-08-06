import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, Eye, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface HistoryItem {
  id: number;
  fileName?: string;
  rawOcrText: string;
  processedText?: string;
  summary?: string;
  confidence?: number;
  createdAt: Date;
}

export default function History() {
  const [, setLocation] = useLocation();
  const [documents, setDocuments] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getHistoryQuery = trpc.ocr.getHistory.useQuery();
  const deleteDocumentMutation = trpc.ocr.deleteDocument.useMutation();

  useEffect(() => {
    if (getHistoryQuery.data) {
      setDocuments(getHistoryQuery.data as HistoryItem[]);
      setIsLoading(false);
    }
  }, [getHistoryQuery.data]);

  const handleDelete = async (documentId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDocumentMutation.mutateAsync({ documentId });
        setDocuments(documents.filter((doc) => doc.id !== documentId));
        toast.success("Document deleted successfully");
      } catch (error) {
        toast.error("Failed to delete document");
      }
    }
  };

  const handleView = (documentId: number) => {
    setLocation(`/results/${documentId}`);
  };

  const handleDownload = (text: string, fileName: string) => {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", `${fileName || "document"}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Document downloaded");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 font-orbitron">
            Document History
          </h1>
          <p className="text-lg text-muted-foreground font-roboto">
            Your saved OCR documents and extraction results
          </p>
        </header>

        {documents.length === 0 ? (
          <Card className="p-12 bg-card border border-border rounded-xl text-center">
            <p className="text-muted-foreground mb-6 font-roboto">
              No documents yet. Start by uploading an image to extract text.
            </p>
            <Button
              onClick={() => setLocation("/upload")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Upload Document
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="p-6 bg-card border border-border rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2 font-orbitron">
                      {doc.fileName || `Document ${doc.id}`}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 font-roboto">
                      {new Date(doc.createdAt).toLocaleDateString()} at{" "}
                      {new Date(doc.createdAt).toLocaleTimeString()}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {doc.confidence && (
                        <span className="inline-block bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-roboto">
                          Confidence: {doc.confidence}%
                        </span>
                      )}
                      {doc.processedText && (
                        <span className="inline-block bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-roboto">
                          Processed
                        </span>
                      )}
                      {doc.summary && (
                        <span className="inline-block bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm font-roboto">
                          Summarized
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-3 line-clamp-2 font-roboto">
                      {doc.processedText || doc.rawOcrText}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap md:flex-col">
                    <Button
                      onClick={() => handleView(doc.id)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button
                      onClick={() =>
                        handleDownload(
                          doc.processedText || doc.rawOcrText,
                          doc.fileName || `document_${doc.id}`
                        )
                      }
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button
                      onClick={() => handleDelete(doc.id)}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
