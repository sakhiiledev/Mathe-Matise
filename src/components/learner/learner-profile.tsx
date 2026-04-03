"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getInitials, formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  enrollments: Array<{
    id: string;
    enrolledAt: Date;
    subject: { name: string; grade: { label: string } };
  }>;
}

const Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export function LearnerProfile({ user }: { user: User }) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(Schema), defaultValues: { name: user.name } });

  const onSubmit = async (data: { name: string }) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, avatarUrl }),
    });
    if (!res.ok) { toast.error("Failed to update profile"); return; }
    toast.success("Profile updated");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) { toast.error("Upload failed"); return; }
      setAvatarUrl(json.data.url);
      toast.success("Profile photo updated");
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 rounded-full bg-primary text-primary-foreground p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-3 w-3" />
                <input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <p className="font-semibold text-lg">{user.name}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Member since {formatDate(user.createdAt)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={user.email} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">Email cannot be changed. Contact your admin.</p>
            </div>
            <Button type="submit" loading={isSubmitting || uploading}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enrolled Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {user.enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">You are not enrolled in any subjects yet.</p>
          ) : (
            <div className="space-y-2">
              {user.enrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-sm">{e.subject.name}</p>
                    <p className="text-xs text-muted-foreground">{e.subject.grade.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{e.subject.grade.label}</Badge>
                    <span className="text-xs text-muted-foreground">Enrolled {formatDate(e.enrolledAt)}</span>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
