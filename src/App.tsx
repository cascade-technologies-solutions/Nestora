import { Suspense, lazy } from "react";
import { Toaster } from "../src/components/ui/toaster";
import { Toaster as Sonner } from "../src/components/ui/sonner";
import { TooltipProvider } from "../src/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
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

// Code-split Admin pages for optimal public initial load performance
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProperties = lazy(() => import("./pages/admin/AdminProperties"));
const AdminPropertyForm = lazy(() => import("./pages/admin/AdminPropertyForm"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminProjectChanges = lazy(() => import("./pages/admin/AdminProjectChanges"));
const AdminProjectForm = lazy(() => import("./pages/admin/AdminProjectForm"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminEnquiries = lazy(() => import("./pages/admin/AdminEnquiries"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminHomepage = lazy(() => import("./pages/admin/AdminHomepage"));
const AdminCMS = lazy(() => import("./pages/admin/AdminCMS"));
const AdminEmployees = lazy(() => import("./pages/admin/AdminEmployees"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const AdminLoadingFallback = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
    <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
    <span className="text-xs uppercase tracking-wider font-medium text-slate-500">Loading Admin Console…</span>
  </div>
);

import { queryClient } from "./lib/queryClient";

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

                {/* ── Admin Routes (Lazy-loaded with Suspense fallback) ── */}
                <Route
                  path="/admin/login"
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminLogin />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <Suspense fallback={<AdminLoadingFallback />}>
                        <AdminLayout />
                      </Suspense>
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
