import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
