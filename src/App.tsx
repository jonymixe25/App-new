import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import Home from "./pages/Home";
import Broadcast from "./pages/Broadcast";
import View from "./pages/View";
import Recordings from "./pages/Recordings";
import AdminNews from "./pages/AdminNews";
import Translator from "./pages/Translator";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-brand-bg flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Broadcast />} />
              <Route path="/view" element={<View />} />
              <Route path="/vista" element={<View />} />
              <Route path="/recordings" element={<Recordings />} />
              <Route path="/admin-news" element={<AdminNews />} />
              <Route path="/traductor" element={<Translator />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}
