import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddNote, useGetAllNotes } from "../hooks/useQueries";
import { useI18n } from "../i18n";

function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

export default function Notes() {
  const { t } = useI18n();
  const { data: notes, isLoading } = useGetAllNotes();
  const addNote = useAddNote();
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await addNote.mutateAsync(content.trim());
      toast.success("Note added!");
      setContent("");
    } catch {
      toast.error("Failed to add note");
    }
  };

  const sorted = [...(notes ?? [])].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: "#154A27" }}>
        {t("notes")}
      </h2>

      {/* Add Note */}
      <Card className="shadow-card border-0">
        <CardContent className="p-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              data-ocid="notes.textarea"
              placeholder={t("noteContent")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              className="flex-1 border-input resize-none text-sm"
            />
            <Button
              data-ocid="notes.submit_button"
              type="submit"
              size="icon"
              className="self-end text-white shrink-0"
              style={{ backgroundColor: "#154A27" }}
              disabled={addNote.isPending || !content.trim()}
            >
              {addNote.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notes List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent
            className="p-6 text-center text-sm text-muted-foreground"
            data-ocid="notes.empty_state"
          >
            {t("noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((note, idx) => (
            <Card
              key={note.id.toString()}
              className="shadow-card border-0"
              data-ocid={`notes.item.${idx + 1}`}
            >
              <CardContent className="p-3">
                <p className="text-sm">{note.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: "#154A27" }}
                  >
                    {note.createdBy.toString().slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {nsToDate(note.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
