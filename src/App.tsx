import { Toaster } from "../src/components/ui/toaster";
import { Toaster as Sonner } from "../src/components/ui/sonner";
import { TooltipProvider } from "../src/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WishlistProvider } from "./contexts/WishlistContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import ScrollToTopButton from "./components/ScrollToTopButton";
import ChatBot from "./components/ChatBot";

// Public pages
import Index from "./pages/Index";
import AllLocalities from "./pages/AllLocalities";
import RealEstate from "./pages/RealEstate";
import About from "./pages/About";
import Services from "./pages/Services";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminPropertyForm from "./pages/admin/AdminPropertyForm";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminProjectChanges from "./pages/admin/AdminProjectChanges";
import AdminProjectForm from "./pages/admin/AdminProjectForm";
import AdminServices from "./pages/admin/AdminServices";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminHomepage from "./pages/admin/AdminHomepage";
import AdminCMS from "./pages/admin/AdminCMS";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter basename="/Nestora">
        <AdminAuthProvider>
          <AuthProvider>
            <WishlistProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* ── Public Routes ────────────────────────────── */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/real-estate" element={<RealEstate />} />
                <Route path="/properties" element={<RealEstate />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/localities" element={<AllLocalities />} />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ── Admin Routes ─────────────────────────────── */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="properties" element={<AdminProperties />} />
                  <Route path="properties/new" element={<AdminPropertyForm />} />
                  <Route path="properties/edit/:id" element={<AdminPropertyForm />} />
                  <Route path="projects" element={<AdminProjects />} />
                  <Route path="projects/changes" element={<AdminProjectChanges />} />
                  <Route path="projects/new" element={<AdminProjectForm />} />
                  <Route path="projects/edit/:id" element={<AdminProjectForm />} />
                  <Route path="services" element={<AdminServices />} />
                  <Route path="enquiries" element={<AdminEnquiries />} />
                  <Route path="media" element={<AdminMedia />} />
                  <Route path="homepage" element={<AdminHomepage />} />
                  <Route path="cms" element={<AdminCMS />} />
                  <Route path="employees" element={<AdminEmployees />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* ── Catch-all ─────────────────────────────────── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ScrollToTopButton />
              <ChatBot />
            </WishlistProvider>
          </AuthProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
