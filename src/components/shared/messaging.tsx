"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getInitials, formatDateTime } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null };
  receiver: { id: string; name: string; avatarUrl: string | null };
}

export function Messaging() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      const json = await res.json();
      setContacts(json.data ?? []);
    } catch { /* silently fail on poll */ }
    finally { setLoadingContacts(false); }
  }, []);

  const fetchMessages = useCallback(async (userId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages?withUserId=${userId}`);
      const json = await res.json();
      setMessages(json.data ?? []);
    } catch { toast.error("Failed to load messages"); }
    finally { setLoadingMessages(false); }
  }, []);

  useEffect(() => {
    fetchContacts();
    pollRef.current = setInterval(fetchContacts, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchContacts]);

  useEffect(() => {
    if (!selectedContact) return;
    fetchMessages(selectedContact.id);
    const interval = setInterval(() => fetchMessages(selectedContact.id), 5000);
    return () => clearInterval(interval);
  }, [selectedContact, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: selectedContact.id, content: newMessage.trim() }),
      });
      if (!res.ok) { toast.error("Failed to send"); return; }
      setNewMessage("");
      fetchMessages(selectedContact.id);
    } finally { setSending(false); }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[400px] rounded-lg border overflow-hidden">
      {/* Contact list */}
      <div className="w-72 border-r flex flex-col shrink-0">
        <div className="p-3 border-b">
          <p className="font-semibold text-sm">Messages</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingContacts ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet</div>
          ) : (
            contacts.map((c) => (
              <button
                key={c.id}
                className={cn(
                  "w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left",
                  selectedContact?.id === c.id && "bg-muted"
                )}
                onClick={() => setSelectedContact(c)}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={c.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-xs truncate">{c.name}</p>
                    {c.unreadCount > 0 && (
                      <Badge className="text-xs h-4 px-1.5 ml-1">{c.unreadCount}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col">
        {!selectedContact ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 border-b">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedContact.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">{getInitials(selectedContact.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{selectedContact.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{selectedContact.role.toLowerCase()}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-48" />)}
                </div>
              ) : messages.map((msg) => {
                const isMe = msg.sender.id === session?.user.id;
                return (
                  <div key={msg.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                    {!isMe && (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-xs">{getInitials(msg.sender.name)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("max-w-xs rounded-2xl px-3 py-2 text-sm", isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none")}>
                      <p>{msg.content}</p>
                      <p className={cn("text-xs mt-1 opacity-70", isMe ? "text-right" : "")}>
                        {formatDateTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
