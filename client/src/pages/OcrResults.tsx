import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Play, Pause, StopCircle, Copy, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";

interface OcrResultsProps {
  rawText: string;
  processedText?: string;
  summary?: string;
  fileName?: string;
  onPostProcess?: () => void;
  onSummarize?: () => void;
}

export default function OcrResults({
  rawText,
  processedText,
  summary,
  fileName,
  onPostProcess,
  onSummarize,
}: OcrResultsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState(processedText || rawText);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const synth = window.speechSynthesis;

  const handlePlay = () => {
    if (isSpeaking) {
      synth.pause();
      setIsPlaying(false);
    } else {
      if (synth.paused) {
        synth.resume();
      } else {
        const utterance = new SpeechSynthesisUtterance(currentText);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPlaying(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPlaying(false);
        };

        synth.speak(utterance);
      }
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    synth.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    synth.cancel();
    setIsSpeaking(false);
    setIsPlaying(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    toast.success("Text copied to clipboard!");
  };

  const handlePostProcess = async () => {
    setIsProcessing(true);
    try {
      if (onPostProcess) {
        await onPostProcess();
      }
      toast.success("Text processed successfully!");
    } catch (error) {
      toast.error("Failed to process text");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      if (onSummarize) {
        await onSummarize();
      }
      toast.success("Summary generated!");
    } catch (error) {
      toast.error("Failed to generate summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 font-orbitron">
            Extraction Results
          </h1>
          {fileName && (
            <p className="text-lg text-muted-foreground font-roboto">
              File: {fileName}
            </p>
          )}
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Text Display */}
          <Card className="md:col-span-2 p-8 bg-card border border-border rounded-xl">
            <h2 className="text-2xl font-bold text-foreground mb-4 font-orbitron">
              Extracted Text
            </h2>
            <div className="bg-background rounded-lg p-6 mb-6 max-h-96 overflow-y-auto">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed font-roboto">
                {currentText}
              </p>
            </div>

            {/* TTS Controls */}
            <div className="bg-secondary/10 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-foreground mb-4 font-orbitron">
                Text-to-Speech
              </h3>
              <div className="flex gap-4 flex-wrap">
                <Button
                  onClick={handlePlay}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Play
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleStop}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop
                </Button>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
            </div>

            {/* Processing Options */}
            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={handlePostProcess}
                disabled={isProcessing}
                className="bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Clean Up Text
                  </>
                )}
              </Button>
              <Button
                onClick={handleSummarize}
                disabled={isSummarizing}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isSummarizing ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Summarize
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Sidebar - Summary & Info */}
          <div className="space-y-6">
            {summary && (
              <Card className="p-6 bg-card border border-border rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-4 font-orbitron">
                  Summary
                </h3>
                <p className="text-muted-foreground leading-relaxed font-roboto">
                  {summary}
                </p>
              </Card>
            )}

            <Card className="p-6 bg-card border border-border rounded-xl">
              <h3 className="text-lg font-bold text-foreground mb-4 font-orbitron">
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-roboto">
                    Characters:
                  </span>
                  <span className="text-foreground font-bold font-roboto">
                    {currentText.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-roboto">
                    Words:
                  </span>
                  <span className="text-foreground font-bold font-roboto">
                    {currentText.split(/\s+/).filter((w) => w.length > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-roboto">
                    Paragraphs:
                  </span>
                  <span className="text-foreground font-bold font-roboto">
                    {currentText.split("\n\n").filter((p) => p.trim().length > 0)
                      .length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
