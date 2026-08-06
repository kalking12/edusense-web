# EduSense Web Application TODO

## Core Features
- [x] **Landing / Home Page:** Introduce EduSense, display product glasses image and app mockup, clear call-to-action.
- [x] **Image Input Interface:** Allow users to upload an image file or capture an image using their device camera for OCR processing.
- [x] **MATLAB OCR Backend Integration:**
  - [x] Node.js backend to spawn MATLAB processes to execute OCR scripts.
  - [x] MATLAB script to perform OCR using Computer Vision Toolbox and output results to a text file.
  - [x] Backend to read MATLAB's text output and send to frontend.
- [x] **Extracted Text Display Panel:** Show recognized text output in a clean, readable format.
- [x] **Text-to-Speech Playback Controls:** Play, pause, and stop controls for reading extracted OCR text aloud (Web Speech API).
- [x] **LLM-Powered Post-processing Layer:** Clean up raw OCR output (correct garbled characters, format equations/technical terms, on-request summarization).
- [x] **Document History Feature:** Save uploaded images and extracted text results for later retrieval (personal archive).

## UI/UX & Styling
- [x] **Responsive, Modern Website UI:** Apply and verify dark-theme responsive design consistently across all pages (landing, upload, results, history).
- [x] **Camera Capture:** Implement device camera capture in the OCR input flow (camera permission handling, live preview, capture action, and fallback/error states).
