import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Upload, X, Camera, CameraOff, Play, Pause, Volume2, Copy, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GoogleVoice {
  name: string;
  lang: string;
  gender: "male" | "female" | "neutral";
}

const GOOGLE_VOICES: GoogleVoice[] = [
  { name: "Google US English", lang: "en-US", gender: "female" },
  { name: "Google UK English", lang: "en-GB", gender: "male" },
  { name: "Google Australian English", lang: "en-AU", gender: "female" },
  { name: "Google Indian English", lang: "en-IN", gender: "male" },
  { name: "Google Spanish", lang: "es-ES", gender: "female" },
  { name: "Google French", lang: "fr-FR", gender: "male" },
  { name: "Google German", lang: "de-DE", gender: "female" },
  { name: "Google Italian", lang: "it-IT", gender: "male" },
  { name: "Google Portuguese", lang: "pt-BR", gender: "female" },
  { name: "Google Japanese", lang: "ja-JP", gender: "male" },
];

export default function OcrPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | null>(null);

  // OCR Results
  const [ocrResults, setOcrResults] = useState<string | null>(null);
  const [processedText, setProcessedText] = useState<string | null>(null);

  // TTS State
  const [selectedVoice, setSelectedVoice] = useState<GoogleVoice>(GOOGLE_VOICES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const processImageMutation = trpc.ocr.processImage.useMutation();
  const postProcessMutation = trpc.ocr.postProcess.useMutation();

  // Check camera permission on mount
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "camera" }).then((result) => {
        setCameraPermission(result.state as "granted" | "denied" | "prompt");
      });
    }
  }, []);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select an image file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCameraPermission("granted");
      }
    } catch (error) {
      toast.error("Camera access denied or unavailable");
      setCameraPermission("denied");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            handleFileSelect(file);
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  };

  const handleProcessImage = async () => {
    if (!selectedImage || !preview) {
      toast.error("Please select an image first");
      return;
    }

    setIsProcessing(true);
    try {
      const base64 = preview.split(",")[1];

      const result = await processImageMutation.mutateAsync({
        imageData: base64,
        fileName: selectedImage.name,
      });

      setOcrResults(result.rawText);
      setProcessedText(result.rawText);
      toast.success("Image processed successfully!");

      // Auto-trigger post-processing
      try {
        const processed = await postProcessMutation.mutateAsync({
          documentId: result.documentId,
          rawText: result.rawText,
        });
        setProcessedText(processed.processedText);
      } catch (error) {
        console.error("Post-processing failed:", error);
      }
    } catch (error) {
      toast.error("Failed to process image");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = async () => {
    if (!processedText) {
      toast.error("No text to speak");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.lang = selectedVoice.lang;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPlaying(false);
      toast.error("Speech synthesis failed");
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = () => {
    if (processedText) {
      navigator.clipboard.writeText(processedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Text copied to clipboard!");
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setPreview(null);
    setOcrResults(null);
    setProcessedText(null);
    setIsPlaying(false);
    setIsSpeaking(false);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 font-orbitron">EduSense OCR</h1>
          <p className="text-lg text-muted-foreground font-roboto">
            Upload a document, extract text with advanced OCR, and listen with natural voice synthesis.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Upload & Processing */}
          <div className="space-y-6">
            {/* Upload Area */}
            <Card className="p-8 bg-card border border-border rounded-xl">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadClick}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/30 hover:border-primary/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold text-foreground mb-2 font-orbitron">
                  Drag & Drop Your Image
                </h3>
                <p className="text-muted-foreground mb-4 font-roboto">
                  or click to browse from your computer
                </p>
                <p className="text-sm text-muted-foreground font-roboto">
                  Supported formats: PNG, JPG, GIF, WebP
                </p>
              </div>
            </Card>

            {/* Camera Capture */}
            <Card className="p-8 bg-card border border-border rounded-xl">
              {!cameraActive ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-bold text-foreground mb-2 font-orbitron">
                    Capture with Camera
                  </h3>
                  <p className="text-muted-foreground mb-6 font-roboto">
                    Use your device camera to capture a document
                  </p>
                  {cameraPermission === "denied" ? (
                    <div className="text-center">
                      <CameraOff className="w-8 h-8 mx-auto mb-2 text-destructive" />
                      <p className="text-sm text-destructive font-roboto">
                        Camera access denied. Please enable it in your browser settings.
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={startCamera}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Open Camera
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 rounded-lg bg-black mb-4 object-cover"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={capturePhoto}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capture
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="px-4"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
            </Card>

            {/* Preview */}
            {preview && (
              <Card className="p-8 bg-card border border-border rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-4 font-orbitron">Preview</h3>
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <p className="text-sm text-muted-foreground mb-4 font-roboto truncate">
                  {selectedImage?.name}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleProcessImage}
                    disabled={isProcessing}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isProcessing ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      "Process Image"
                    )}
                  </Button>
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    className="px-4"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Results & TTS */}
          <div className="space-y-6">
            {ocrResults && (
              <>
                {/* Voice Selection */}
                <Card className="p-6 bg-card border border-border rounded-xl">
                  <h3 className="text-lg font-bold text-foreground mb-4 font-orbitron">
                    <Volume2 className="w-5 h-5 inline mr-2" />
                    Voice Selection
                  </h3>
                  <Select
                    value={selectedVoice.name}
                    onValueChange={(value) => {
                      const voice = GOOGLE_VOICES.find((v) => v.name === value);
                      if (voice) setSelectedVoice(voice);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOOGLE_VOICES.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.gender})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>

                {/* TTS Controls */}
                <Card className="p-6 bg-card border border-border rounded-xl">
                  <h3 className="text-lg font-bold text-foreground mb-4 font-orbitron">
                    Text-to-Speech Controls
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={speakText}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Stop Speaking
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Play Audio
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Extracted Text */}
                <Card className="p-6 bg-card border border-border rounded-xl">
                  <h3 className="text-lg font-bold text-foreground mb-4 font-orbitron">
                    Extracted Text
                  </h3>
                  <div className="bg-background/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <p className="text-foreground font-roboto whitespace-pre-wrap leading-relaxed">
                      {processedText}
                    </p>
                  </div>
                </Card>

                {/* Clear Button */}
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear & Start Over
                </Button>
              </>
            )}

            {!ocrResults && (
              <Card className="p-8 bg-card border border-border rounded-xl flex items-center justify-center min-h-96">
                <div className="text-center">
                  <p className="text-muted-foreground font-roboto">
                    Upload an image or capture with your camera to see the extracted text and TTS controls here.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
