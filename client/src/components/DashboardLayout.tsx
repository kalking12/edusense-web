import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">EduSense</h1>
            <p className="text-sm text-gray-600">OCR & Text-to-Speech</p>
          </div>
          <nav className="flex gap-4">
            <Button
              variant={isActive("/") ? "default" : "outline"}
              onClick={() => setLocation("/")}
              className={isActive("/") ? "bg-blue-600" : ""}
            >
              Home
            </Button>
            <Button
              variant={isActive("/upload") ? "default" : "outline"}
              onClick={() => setLocation("/upload")}
              className={isActive("/upload") ? "bg-blue-600" : ""}
            >
              Upload
            </Button>
            <Button
              variant={isActive("/history") ? "default" : "outline"}
              onClick={() => setLocation("/history")}
              className={isActive("/history") ? "bg-blue-600" : ""}
            >
              History
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
