import { Router, Route } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import Home from "@/pages/Home";
import OcrUpload from "@/pages/OcrUpload";
import OcrHistory from "@/pages/OcrHistory";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Router>
      <DashboardLayout>
        <Route path="/" component={Home} />
        <Route path="/upload" component={OcrUpload} />
        <Route path="/history" component={OcrHistory} />
        <Route component={NotFound} />
      </DashboardLayout>
    </Router>
  );
}
