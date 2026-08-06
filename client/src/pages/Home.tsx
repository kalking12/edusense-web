import { useLocation } from 'wouter';
import { useAuth } from '../_core/hooks/useAuth';

export default function Home() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  const handleStartProcessing = () => {
    navigate('/upload');
  };

  return (
    <>
      <header>
        <a href="/" className="brand">
          <span className="mark"></span>
          EduSense
        </a>
        <nav>
          <a href="/" className="active">Upload</a>
          <a href="/history">History</a>
          {user && (
            <span style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
              {user.name || 'User'} 
              <button 
                onClick={() => logout()}
                style={{
                  marginLeft: '1rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--amber)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                Logout
              </button>
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
            <div className="dropzone">
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
            </div>

            <div className="actions">
              <a href="/upload" className="btn-primary" style={{ textDecoration: 'none' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start Processing
              </a>
            </div>
          </div>
        </div>

        <div>
          <span className="panel-label">02 — Features</span>
          <div className="the-page">
            <div className="empty-state">
              <div className="glyph">✨</div>
              <p>Upload a document to extract text with advanced OCR and listen with natural voice synthesis.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
