import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CreateTripPage } from "./pages/CreateTripPage";
import { HomePage } from "./pages/HomePage";
import { TripPage } from "./pages/TripPage";
import { SkinScanPage } from "./pages/SkinScanPage";

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trips/new" element={<CreateTripPage />} />
          <Route path="/trips/:tripId" element={<TripPage />} />
          <Route path="/trips/:tripId/skin-scan" element={<SkinScanPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
