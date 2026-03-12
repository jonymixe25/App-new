import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";

const Home = lazy(() => import("./pages/Home"));
const Broadcast = lazy(() => import("./pages/Broadcast"));
const View = lazy(() => import("./pages/View"));
const Recordings = lazy(() => import("./pages/Recordings"));
const AdminNews = lazy(() => import("./pages/AdminNews"));
const Team = lazy(() => import("./pages/Team"));

const LoadingFallback = () => (
  <div className="min-h-screen bg-brand-bg flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-bg flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Broadcast />} />
              <Route path="/view" element={<View />} />
              <Route path="/vista" element={<View />} />
              <Route path="/recordings" element={<Recordings />} />
              <Route path="/admin-news" element={<AdminNews />} />
              <Route path="/team" element={<Team />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}
