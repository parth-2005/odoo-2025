import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Employee from "./pages/Employee";
import Manager from "./pages/Manager";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Restricted from "./pages/Restricted";
import { ROLES } from "@/constants/roles";
import { ProtectedRoute, roleLanding, TopBar } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;
  return <Navigate to={roleLanding(user.role)} replace />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TopBar />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<Signin />} />

            {/* Employee portal */}
            <Route element={<ProtectedRoute allow={[ROLES.EMPLOYEE]} />}>
              <Route path="/employee" element={<Employee />} />
            </Route>

            {/* Manager portal */}
            <Route element={<ProtectedRoute allow={[ROLES.MANAGER]} />}>
              <Route path="/manager" element={<Manager />} />
            </Route>

            {/* Admin portal */}
            <Route element={<ProtectedRoute allow={[ROLES.ADMIN]} />}>
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route path="/restricted" element={<Restricted />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
