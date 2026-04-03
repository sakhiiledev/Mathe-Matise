"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { FileText, Video, File, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  type: "VIDEO" | "PDF" | "DOCUMENT";
  createdAt: string;
  subject: { id: string; name: string };
  grade: { label: string };
  capsTopic: { id: string; title: string; term: number } | null;
}

const typeIconMap = { VIDEO: Video, PDF: FileText, DOCUMENT: File };
const typeBadge: Record<string, "default" | "secondary" | "outline"> = {
  VIDEO: "default", PDF: "secondary", DOCUMENT: "outline",
};

export function LearnerLearning() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [termFilter, setTermFilter] = useState<string>("all");
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/materials?pageSize=200");
      const json = await res.json();
      setMaterials(json.data ?? []);
    } catch { toast.error("Failed to load materials"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const filtered = termFilter === "all"
    ? materials
    : materials.filter((m) => m.capsTopic?.term === parseInt(termFilter));

  // Group by subject → topic
  type GroupedData = Record<string, { topicTitle: string; term: number; materials: Material[] }>;
  const grouped: Record<string, GroupedData> = {};

  for (const m of filtered) {
    const subjectKey = `${m.subject.name}`;
    const topicKey = m.capsTopic ? m.capsTopic.id : "general";
    const topicTitle = m.capsTopic ? `Term ${m.capsTopic.term}: ${m.capsTopic.title}` : "General";
    const term = m.capsTopic?.term ?? 0;

    if (!grouped[subjectKey]) grouped[subjectKey] = {};
    if (!grouped[subjectKey][topicKey]) {
      grouped[subjectKey][topicKey] = { topicTitle, term, materials: [] };
    }
    grouped[subjectKey][topicKey].materials.push(m);
  }

  const toggleTopic = (key: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            <SelectItem value="1">Term 1</SelectItem>
            <SelectItem value="2">Term 2</SelectItem>
            <SelectItem value="3">Term 3</SelectItem>
            <SelectItem value="4">Term 4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          No learning materials available yet.
        </div>
      ) : (
        Object.entries(grouped).map(([subjectName, topics]) => (
          <div key={subjectName} className="space-y-2">
            <h3 className="text-base font-semibold">{subjectName}</h3>
            {Object.entries(topics)
              .sort((a, b) => a[1].term - b[1].term)
              .map(([topicId, { topicTitle, materials: topicMaterials }]) => {
                const isExpanded = expandedTopics.has(topicId);
                return (
                  <div key={topicId} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      onClick={() => toggleTopic(topicId)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="text-sm font-medium">{topicTitle}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{topicMaterials.length} item{topicMaterials.length !== 1 ? "s" : ""}</Badge>
                    </button>

                    {isExpanded && (
                      <div className="border-t divide-y">
                        {topicMaterials.map((m) => {
                          const Icon = typeIconMap[m.type];
                          return (
                            <div key={m.id} className="flex items-center justify-between p-3 bg-muted/20">
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">{m.title}</p>
                                  {m.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant={typeBadge[m.type]} className="text-xs">{m.type}</Badge>
                                <Button asChild size="sm" variant="outline" className="h-7 px-2">
                                  <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" /> Open
                                  </a>
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ))
      )}
    </div>
  );
}
