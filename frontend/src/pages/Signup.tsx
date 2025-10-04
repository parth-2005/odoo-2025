import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { roleLanding } from "@/components/ProtectedRoute";

import axios from "axios";
const fetchCountries = async () => {
  const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,cca2");
  const data = res.data;
  return (
    data.map((c: any) => ({ code: c.cca2, name: c.name?.common ?? c.name })).sort((a: any, b: any) => a.name.localeCompare(b.name)) || []
  );
};

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: countries = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60, // 1 hour cache since country list rarely changes
  });

  const [company, setCompany] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const { signup, loading, user } = useAuth();

  useEffect(() => {
    if (user) navigate(roleLanding(user.role), { replace: true });
  }, [user, navigate]);
  if (user) return <div className="p-6 text-center text-sm text-muted-foreground">Redirecting...</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company || !adminName || !email || !password || !confirmPassword || !country) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Find country code (approx): try matching by name's first word ignoring case
    const found = countries.find((c: any) => c.name === country);
    const countryCode = found?.code || country.slice(0, 2).toUpperCase();

    try {
      await signup({
        email,
        password,
        full_name: adminName,
        company_name: company,
        country_code: countryCode,
      });
  const stored = localStorage.getItem('auth_user');
  const role = stored ? JSON.parse(stored).role : undefined;
  navigate(roleLanding(role));
    } catch (_) {
      // errors handled in context toast
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-2">Create an account</h1>
        <p className="text-sm text-muted-foreground mb-6">Set up your company and administrator account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company name</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminName">Admin name</Label>
            <Input id="adminName" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={country} onValueChange={(v) => setCountry(v)} disabled={isLoading || isError}>
              <SelectTrigger id="country">
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Loading countries..."
                      : isError
                        ? "Failed to load"
                        : "Select country"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c: any) => (
                  <SelectItem key={c.code || c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isError && (
              <div className="text-xs text-destructive flex items-center gap-2">
                <span>{(error as Error)?.message || "Could not fetch countries."}</span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
