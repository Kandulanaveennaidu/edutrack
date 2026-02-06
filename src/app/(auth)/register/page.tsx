"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function RegisterPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    school_name: "",
    address: "",
    phone: "",
    email: "",
    admin_email: "",
    admin_password: "",
    confirm_password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.admin_password !== formData.confirm_password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      });
      return;
    }

    if (formData.admin_password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_name: formData.school_name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          admin_email: formData.admin_email,
          admin_password: formData.admin_password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSchoolId(result.school_id);
        toast({
          variant: "success",
          title: "Registration Successful!",
          description: `Your School ID is: ${result.school_id}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.error || "Something went wrong",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (schoolId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              Registration Complete!
            </h1>
          </div>
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
              <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                <p className="text-sm text-green-700">Your School ID</p>
                <p className="text-3xl font-bold text-green-800 mt-1">
                  {schoolId}
                </p>
              </div>
              <p className="text-sm text-slate-600">
                Save this School ID! You&apos;ll need it to login. Share it with
                your teachers so they can login too.
              </p>
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-200 text-left">
                <p className="text-sm font-medium text-blue-800">
                  Login Credentials:
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  School ID: <strong>{schoolId}</strong>
                </p>
                <p className="text-sm text-blue-700">
                  Email: <strong>{formData.admin_email}</strong>
                </p>
                <p className="text-sm text-blue-700">
                  Role: <strong>Admin</strong>
                </p>
              </div>
              <Link href="/login">
                <Button className="w-full mt-4">Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">EduTrack</h1>
          <p className="mt-1 text-slate-500">Register your School / College</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>School Registration</CardTitle>
            <CardDescription>
              Create an account to manage your school&apos;s attendance
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school_name">School / College Name *</Label>
                <Input
                  id="school_name"
                  placeholder="Enter school name"
                  value={formData.school_name}
                  onChange={(e) =>
                    setFormData({ ...formData, school_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">School Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="school@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="School address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <hr className="my-2" />

              <div className="space-y-2">
                <Label htmlFor="admin_email">Admin Email *</Label>
                <Input
                  id="admin_email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.admin_email}
                  onChange={(e) =>
                    setFormData({ ...formData, admin_email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_password">Password *</Label>
                  <Input
                    id="admin_password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={formData.admin_password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        admin_password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password *</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirm_password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirm_password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register School"
                )}
              </Button>
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Already have an account? Sign in
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
