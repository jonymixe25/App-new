import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Broadcast from "./pages/Broadcast";
import View from "./pages/View";

import Recordings from "./pages/Recordings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Broadcast />} />
        <Route path="/view" element={<View />} />
        <Route path="/vista" element={<View />} />
        <Route path="/recordings" element={<Recordings />} />
      </Routes>
    </BrowserRouter>
  );
}
