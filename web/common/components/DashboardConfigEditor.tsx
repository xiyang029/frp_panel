import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLinkIcon, RefreshCwIcon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

interface DashboardConfigEditorProps {
  title: string;
  cardTitle: string;
  docUrl?: string;
  textareaMinRows?: number;
  showRefresh?: boolean;
  fetchConfig: () => Promise<string>;
  saveConfig: (content: string) => Promise<void>;
  reloadConfig?: () => Promise<void>;
}

export function DashboardConfigEditor({
  title,
  cardTitle,
  docUrl,
  textareaMinRows = 18,
  showRefresh = true,
  fetchConfig,
  saveConfig,
  reloadConfig,
}: DashboardConfigEditorProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      setContent(await fetchConfig());
    } catch (err: any) {
      toast.error("获取配置失败：" + (err.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig(content);
      if (reloadConfig) {
        await reloadConfig();
      }
      toast.success("配置已保存");
    } catch (err: any) {
      toast.error("保存配置失败：" + (err.message || "未知错误"));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex items-center gap-2">
          {docUrl ? (
            <Button variant="ghost" asChild>
              <a href={docUrl} target="_blank" rel="noreferrer">
                <ExternalLinkIcon data-icon="inline-start" />
                文档
              </a>
            </Button>
          ) : null}
          {showRefresh ? (
            <Button variant="outline" onClick={loadConfig} disabled={loading}>
              {loading ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RefreshCwIcon data-icon="inline-start" />
              )}
              刷新
            </Button>
          ) : null}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <SaveIcon data-icon="inline-start" />
            )}
            保存
          </Button>
        </div>
      </div>
      {cardTitle}
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        style={{ minHeight: `${textareaMinRows * 1.5}rem` }}
        className="font-mono"
      />
    </div>
  );
}
