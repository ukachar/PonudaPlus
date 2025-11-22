import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import Login from "./auth/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import Settings from "./pages/Settings";
import Ponude from "./pages/Ponude";
import Prijem from "./pages/Prijem";
import KreirajPonudu from "./pages/KreirajPonudu";
import UrediPonudu from "./pages/UrediPonudu";
import Header from "./components/Header";
import PonudaPDF from "./pages/PonudaPDF";
import PrijemPDF from "./pages/PrijemPDF";
import QRLabelPrint from "./pages/QRLabelPrint";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Header />
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Header />
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ponude"
            element={
              <ProtectedRoute>
                <Header />
                <Ponude />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kreiraj-ponudu"
            element={
              <ProtectedRoute>
                <Header />
                <KreirajPonudu />
              </ProtectedRoute>
            }
          />

          <Route
            path="/uredi-ponudu/:id"
            element={
              <ProtectedRoute>
                <Header />
                <UrediPonudu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prijem"
            element={
              <ProtectedRoute>
                <Header />
                <Prijem />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ponuda-pdf/:id"
            element={
              <ProtectedRoute>
                <PonudaPDF />
              </ProtectedRoute>
            }
          />

          <Route
            path="/prijem-pdf/:id"
            element={
              <ProtectedRoute>
                <PrijemPDF />
              </ProtectedRoute>
            }
          />

          <Route
            path="/qr-label/:id"
            element={
              <ProtectedRoute>
                <QRLabelPrint />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
