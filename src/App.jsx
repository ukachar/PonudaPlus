import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import Login from "./auth/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import Settings from "./pages/Settings";
import Ponude from "./pages/Ponude";
import Prijem from "./pages/Prijem";
import KreirajPonudu from "./pages/KreirajPonudu";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ponude"
            element={
              <ProtectedRoute>
                <Ponude />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kreiraj-ponudu"
            element={
              <ProtectedRoute>
                <KreirajPonudu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prijem"
            element={
              <ProtectedRoute>
                <Prijem />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
