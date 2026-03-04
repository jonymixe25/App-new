import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Broadcast from "./pages/Broadcast";
import View from "./pages/View";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<View />} />
        <Route path="/admin" element={<Broadcast />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
