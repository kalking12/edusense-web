import { useEffect, useState } from "react";
import { useParams } from "wouter";
import OcrResults from "./OcrResults";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface RouteParams {
  id: string;
}

export default function ResultsWrapper() {
  const params = useParams<RouteParams>();
  const documentId = params?.id ? parseInt(params.id, 10) : null;
  const [isLoading, setIsLoading] = useState(true);
  const [documentData, setDocumentData] = useState<any>(null);

  const getDocumentQuery = trpc.ocr.getDocument.useQuery(
    { documentId: documentId || 0 },
    { enabled: documentId !== null }
  );

  const postProcessMutation = trpc.ocr.postProcess.useMutation();
  const summarizeMutation = trpc.ocr.summarize.useMutation();

  useEffect(() => {
    if (getDocumentQuery.data) {
      setDocumentData(getDocumentQuery.data);
      setIsLoading(false);
    }
  }, [getDocumentQuery.data]);

  const handlePostProcess = async () => {
    if (!documentId || !documentData) return;
    try {
      const result = await postProcessMutation.mutateAsync({
        documentId,
        rawText: documentData.rawOcrText,
      });
      setDocumentData({
        ...documentData,
        processedText: result.processedText,
      });
    } catch (error) {
      toast.error("Failed to post-process text");
    }
  };

  const handleSummarize = async () => {
    if (!documentId || !documentData) return;
    try {
      const result = await summarizeMutation.mutateAsync({
        documentId,
        text: documentData.processedText || documentData.rawOcrText,
      });
      setDocumentData({
        ...documentData,
        summary: result.summary,
      });
    } catch (error) {
      toast.error("Failed to generate summary");
    }
  };

  if (isLoading || !documentData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <OcrResults
      rawText={documentData.rawOcrText}
      processedText={documentData.processedText}
      summary={documentData.summary}
      fileName={documentData.fileName}
      onPostProcess={handlePostProcess}
      onSummarize={handleSummarize}
    />
  );
}
