import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Broadcast from "./pages/Broadcast";
import View from "./pages/View";
import Recordings from "./pages/Recordings";
import AdminNews from "./pages/AdminNews";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import { UserProvider, useUser } from "./contexts/UserContext";

function AppContent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, loading } = useUser();

  useEffect(() => {
    // Show modal after a short delay on first entry if not logged in
    const hasSeenModal = sessionStorage.getItem("hasSeenAuthModal");
    if (!hasSeenModal && !loading && !user) {
      const timer = setTimeout(() => {
        setIsAuthModalOpen(true);
        sessionStorage.setItem("hasSeenAuthModal", "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Broadcast />} />
          <Route path="/view" element={<View />} />
          <Route path="/vista" element={<View />} />
          <Route path="/recordings" element={<Recordings />} />
          <Route path="/admin-news" element={<AdminNews />} />
        </Routes>
      </main>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UserProvider>
  );
}
