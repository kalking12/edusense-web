import { useState, useRef } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { trpc } from '../lib/trpc';

export default function OcrUpload() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'ready'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const processImageMutation = trpc.ocr.processImage.useMutation();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleProcessImage = async () => {
    if (!selectedFile) {
      alert('Please select an image first');
      return;
    }

    setIsProcessing(true);
    setStatus('processing');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        const result = await processImageMutation.mutateAsync({
          imageData: base64,
          fileName: selectedFile.name,
        });
        setExtractedText(result.rawText);
        setStatus('ready');
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to process image');
      setStatus('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setExtractedText(null);
    setStatus('idle');
  };

  const handleListen = () => {
    if (extractedText && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(extractedText);
      speechSynthesis.speak(utterance);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please log in to use this feature</p>
      </div>
    );
  }

  return (
    <>
      <header>
        <a href="/" className="brand">
          <span className="mark"></span>
          EduSense
        </a>
        <nav>
          <a href="/">Upload</a>
          <a href="/history" className="active">History</a>
          {user && (
            <span style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
              {user.name || 'User'}
            </span>
          )}
        </nav>
      </header>

      <div className="intro">
        <span className="eyebrow">Document processor</span>
        <h1>Scan a page, get the text back</h1>
        <p>Upload a photo of lecture notes, a handout, or a textbook page. EduSense extracts the text and can read it aloud.</p>
      </div>

      <div className="layout">
        <div>
          <span className="panel-label">01 — Upload</span>
          <div className="desk">
            <div
              ref={dropzoneRef}
              className={`dropzone ${status === 'processing' ? 'processing' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="scan-line"></div>
              <div className="icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                  <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                </svg>
              </div>
              <h3>Drag a photo here</h3>
              <p>or click to browse your files</p>
              <div className="filetypes">PNG · JPG · WEBP — up to 10MB</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
            </div>

            {selectedFile && (
              <div className="preview-row">
                {preview && <div className="thumb" style={{ backgroundImage: `url(${preview})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>}
                <div className="file-meta">
                  <div className="name">{selectedFile.name}</div>
                  <div className="size">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</div>
                </div>
              </div>
            )}

            <div className="actions">
              <button
                className="btn-primary"
                onClick={handleProcessImage}
                disabled={!selectedFile || isProcessing}
                style={{ opacity: !selectedFile || isProcessing ? 0.5 : 1 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                {isProcessing ? 'Processing…' : 'Process Image'}
              </button>
              {selectedFile && <button className="btn-ghost" onClick={handleCancel}>Cancel</button>}
            </div>
          </div>
        </div>

        <div>
          <span className="panel-label">02 — Extracted text</span>
          <div className="the-page">
            {extractedText ? (
              <>
                <div className="the-page-header">
                  <h3>Result</h3>
                  <span className="status-pill">{status === 'ready' ? 'Ready' : 'Processing'}</span>
                </div>
                <div className="extracted">{extractedText}</div>
                <div className="result-actions">
                  <button className="btn-amber" onClick={handleListen}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                    Listen
                  </button>
                  <button className="btn-ghost">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="glyph">📄</div>
                <p>Upload and process an image to see extracted text here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
