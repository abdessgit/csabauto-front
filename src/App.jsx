import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleBasedRedirect from './routes/RoleBasedRedirect';

// Pages publiques
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Inscription from './pages/Inscription';
import VerifierEmail from './pages/VerifierEmail';
import MotDePasseOublie from './pages/MotDePasseOublie';
import ReinitialiserMotDePasse from './pages/ReinitialiserMotDePasse';
import Vehicules from './pages/Vehicules';
import VehiculeDetail from './pages/VehiculeDetail';
import MentionsLegales from './pages/MentionsLegales';
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite';
import CGU from './pages/CGU';

// Pages Espace Client
import ClientDashboard from './pages/ClientDashboard';
import MesRendezVous from './pages/client/MesRendezVous';
import MesVehicules from './pages/client/MesVehicules';
import MesDemandes from './pages/client/MesDemandes';
import MesFactures from './pages/client/MesFactures';
import MonProfil from './pages/client/MonProfil';

// Pages Espace Modérateur
import DashboardModerateur from './pages/DashboardModerateur';
import RendezVousModerateur from './pages/RendezVousModerateur';
import ClientsListe from './pages/moderateur/ClientsListe';
import VehiculesListe from './pages/moderateur/VehiculesListe';
import InterventionsListe from './pages/moderateur/InterventionsListe';
import FacturesListe from './pages/moderateur/FacturesListe';
import AnnoncesListe from './pages/moderateur/AnnoncesListe';
import ConversationsListe from './pages/moderateur/ConversationsListe';
import MessagesContactListe from './pages/moderateur/MessagesContactListe';

// Pages Espace Administrateur
import DashboardAdmin from './pages/DashboardAdmin';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ================= SITE PUBLIC ================= */}
          <Route path="/" element={<Home />} />
          <Route path="/vehicules" element={<Vehicules />} />
          <Route path="/vehicules/:id" element={<VehiculeDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/verifier-email" element={<VerifierEmail />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialite />} />
          <Route path="/cgu" element={<CGU />} />

          {/* ================= REDIRECTION DASHBOARD ================= */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />

          {/* ================= ESPACE CLIENT ================= */}
          <Route
            path="/dashboard/client"
            element={
              <ProtectedRoute requiredRole="ROLE_CLIENT">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/client/rendez-vous"
            element={
              <ProtectedRoute requiredRole="ROLE_CLIENT">
                <MesRendezVous />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/client/vehicules"
            element={
              <ProtectedRoute requiredRole="ROLE_CLIENT">
                <MesVehicules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/client/demandes"
            element={
              <ProtectedRoute requiredRole="ROLE_CLIENT">
                <MesDemandes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/client/factures"
            element={
              <ProtectedRoute requiredRole="ROLE_CLIENT">
                <MesFactures />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/client/profil"
            element={
              <ProtectedRoute requiredRole="ROLE_CLIENT">
                <MonProfil />
              </ProtectedRoute>
            }
          />

          {/* ================= ESPACE MODÉRATEUR ================= */}
          <Route
            path="/dashboard/moderateur"
            element={
              <ProtectedRoute requiredRole="ROLE_MODERATEUR">
                <DashboardModerateur />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/moderateur/rendez-vous"
            element={
              <ProtectedRoute requiredRole="ROLE_MODERATEUR">
                <RendezVousModerateur />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/moderateur/clients"
            element={
              <ProtectedRoute requiredRole="ROLE_MODERATEUR">
                <ClientsListe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/moderateur/vehicules"
            element={
              <ProtectedRoute requiredRole="ROLE_MODERATEUR">
                <VehiculesListe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/moderateur/interventions"
            element={
              <ProtectedRoute requiredRole="ROLE_MODERATEUR">
                <InterventionsListe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/moderateur/factures"
            element={
              <ProtectedRoute requiredRole="ROLE_MODERATEUR">
                <FacturesListe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/moderateur/annonces"
            element={
              <ProtectedRoute requiredRole="ROLE_MODERATEUR">
                <AnnoncesListe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/moderateur/conversations"
            element={
              <ProtectedRoute requiredRole="ROLE_MODERATEUR">
                <ConversationsListe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/moderateur/messages-contact"
            element={
              <ProtectedRoute requiredRole="ROLE_MODERATEUR">
                <MessagesContactListe />
              </ProtectedRoute>
            }
          />

          {/* ================= ESPACE ADMINISTRATEUR ================= */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
