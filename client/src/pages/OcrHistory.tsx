import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, Volume2, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function OcrHistory() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const getHistoryQuery = trpc.ocr.getHistory.useQuery();
  const deleteDocMutation = trpc.ocr.deleteDocument.useMutation();

  useEffect(() => {
    if (getHistoryQuery.data) {
      setDocuments(getHistoryQuery.data);
      setIsLoading(false);
    }
  }, [getHistoryQuery.data]);

  const handleDelete = async (id: number) => {
    try {
      await deleteDocMutation.mutateAsync({ documentId: id });
      setDocuments(documents.filter((doc) => doc.id !== id));
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
      }
      toast.success("Document deleted");
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const handleSpeak = (text: string) => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      toast.error("Speech synthesis failed");
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Documents</h2>
        <p className="text-gray-600">Upload a document to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Document History</h2>
        <p className="text-gray-600">{documents.length} documents processed</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-1 space-y-3">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className={`p-4 cursor-pointer border-2 transition-all ${
                selectedDoc?.id === doc.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-blue-400"
              }`}
            >
              <p className="font-semibold text-gray-900 truncate">
                {doc.fileName || `Document ${doc.id}`}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>

        {/* Document Details */}
        {selectedDoc && (
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 bg-white border-2 border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedDoc.fileName || `Document ${selectedDoc.id}`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedDoc.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleDelete(selectedDoc.id)}
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {selectedDoc.imageUrl && (
                <div className="mb-6">
                  <img
                    src={selectedDoc.imageUrl}
                    alt="Document"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Extracted Text</h4>
                <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-gray-800 whitespace-pre-wrap text-sm">
                    {selectedDoc.rawOcrText}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleSpeak(selectedDoc.rawOcrText)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  {isPlaying ? "Stop" : "Listen"}
                </Button>
                <Button
                  onClick={() => handleCopy(selectedDoc.rawOcrText)}
                  variant="outline"
                  className="px-4"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
