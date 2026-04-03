"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Trash2, FileText, Video, File, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

interface Material {
  id: string;
  title: string;
  type: "VIDEO" | "PDF" | "DOCUMENT";
  isApproved: boolean;
  createdAt: string;
  subject: { name: string };
  grade: { label: string };
  uploader: { name: string };
}

const typeIconMap = {
  VIDEO: Video,
  PDF: FileText,
  DOCUMENT: File,
};

export function ContentManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter] = useState("");
  const [approvedFilter, setApprovedFilter] = useState<string>("all");

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "100" });
      if (approvedFilter !== "all") params.set("approved", approvedFilter);
      if (gradeFilter) params.set("gradeId", gradeFilter);
      const res = await fetch(`/api/materials?${params}`);
      const json = await res.json();
      setMaterials(json.data ?? []);
    } catch {
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, [approvedFilter, gradeFilter]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const toggleApproval = async (material: Material) => {
    const res = await fetch(`/api/materials/${material.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: !material.isApproved }),
    });
    if (!res.ok) { toast.error("Failed to update material"); return; }
    toast.success(`Material ${material.isApproved ? "unapproved" : "approved"}`);
    fetchMaterials();
  };

  const deleteMaterial = async (id: string) => {
    const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete material"); return; }
    toast.success("Material deleted");
    fetchMaterials();
  };

  const columns: ColumnDef<Material>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const Icon = typeIconMap[row.original.type];
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm">{row.original.title}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "subject.name",
      header: "Subject",
      cell: ({ row }) => <span className="text-sm">{row.original.subject.name}</span>,
    },
    {
      accessorKey: "grade.label",
      header: "Grade",
      cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.original.grade.label}</Badge>,
    },
    {
      accessorKey: "uploader.name",
      header: "Uploaded by",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.uploader.name}</span>,
    },
    {
      accessorKey: "isApproved",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isApproved ? "success" : "warning"}>
          {row.original.isApproved ? "Approved" : "Pending"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggleApproval(row.original)}>
              {row.original.isApproved ? (
                <><XCircle className="mr-2 h-4 w-4" /> Unapprove</>
              ) : (
                <><CheckCircle className="mr-2 h-4 w-4" /> Approve</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => deleteMaterial(row.original.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={approvedFilter} onValueChange={setApprovedFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Approval status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Materials</SelectItem>
            <SelectItem value="true">Approved</SelectItem>
            <SelectItem value="false">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={materials}
        loading={loading}
        searchKey="title"
        searchPlaceholder="Search materials..."
      />
    </div>
  );
}
