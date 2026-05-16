"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, EnvelopeSimple, Phone, LockKey, RocketLaunch, Spinner } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Success! Redirect to login
        router.push("/login?registered=true");
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mt-8 mb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Lumebiz</h1>
          <p className="text-sm text-muted-foreground mt-1">Start your business registration journey</p>
        </div>

        <Card className="border-border shadow-sm">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-xl">Create an account</CardTitle>
              <CardDescription>Enter your details to get started.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Legal Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input id="fullName" value={formData.fullName} onChange={handleChange} required placeholder="John Doe" className="pl-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" className="pl-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="0801 234 5678" className="pl-10" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <div className="relative">
                  <LockKey className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className="pl-10" />
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" disabled={loading} className="w-full text-md h-11">
                {loading ? (
                  <Spinner className="animate-spin h-5 w-5" weight="bold" />
                ) : (
                  <>Create Account <RocketLaunch className="ml-2 h-5 w-5" weight="bold" /></>
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Powered by Quadrox Technologies Limited
          </p>
        </div>
      </div>
    </div>
  );
}
