import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Broadcast from "./pages/Broadcast";
import View from "./pages/View";
import Recordings from "./pages/Recordings";
import AdminNews from "./pages/AdminNews";
import Team from "./pages/Team";
import Navbar from "./components/Navbar";

export default function App() {
  return (
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
            <Route path="/team" element={<Team />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
