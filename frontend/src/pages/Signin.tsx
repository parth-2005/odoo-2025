import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { roleLanding } from "@/components/ProtectedRoute";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Signin: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(roleLanding(user.role), { replace: true });
    }
  }, [user, navigate]);
  if (user) return <div className="p-6 text-center text-sm text-muted-foreground">Redirecting...</div>;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    try {
  await login(email, password);
  navigate(roleLanding(localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user') as string).role : undefined));
    } catch (_) {
      // error toast handled in context
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-2">Sign in</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter your credentials to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Signin;
