import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessAdminDashboard } from "@shared/roles";
import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "@/lib/router";
import { toast } from "sonner";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminImageUploader from "@/components/AdminImageUploader";
import AdminMenus from "@/components/AdminMenus";
import { Switch } from "@/components/ui/switch";
import AdminActionsMenu from "@/components/AdminActionsMenu";
import AdminViewToggle, {
  type AdminListView,
} from "@/components/AdminViewToggle";
import {
  V2_PAGE_LIST,
  V2_FIELDS,
  V2_SECTIONS,
  type V2Field,
  type V2ListItem,
} from "@/components/home-v2/content";
import {
  fallbackValue,
  parseList,
  parseMenus,
  resolveValue,
} from "@/components/home-v2/useV2Content";
import {
  ArrowDown,
  ArrowLeft,
  Calendar,
  FileText,
  Layers,
  ArrowUp,
  ExternalLink,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

type View =
  | { kind: "pages" }
  | { kind: "page"; slug: string }
  | { kind: "menus" }
  | { kind: "settings" };

function parseView(pathname: string): View {
  const page = /^\/admin\/website\/pages\/([^/]+)/.exec(pathname);
  if (page) return { kind: "page", slug: decodeURIComponent(page[1]) };
  if (pathname.startsWith("/admin/website/menus")) return { kind: "menus" };
  if (pathname.startsWith("/admin/website/settings"))
    return { kind: "settings" };
  return { kind: "pages" };
}

const ALL_FIELDS = V2_SECTIONS.flatMap(section => section.fields);

const inputClass =
  "h-11 w-full border border-[#d9d9d9] bg-white px-3.5 text-sm outline-none focus:border-[#c76f42]";
const textareaClass =
  "w-full resize-y border border-[#d9d9d9] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#c76f42]";

function ListEditor({
  field,
  value,
  onChange,
}: {
  field: Extract<V2Field, { type: "list" }>;
  value: string;
  onChange: (value: string) => void;
}) {
  const items = parseList(value, field);
  const commit = (next: V2ListItem[]) => onChange(JSON.stringify(next));
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    commit(next);
  };
  const blank = () =>
    Object.fromEntries(field.itemFields.map(itemField => [itemField.name, ""]));

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase text-[#747d87]">
              {field.itemLabel} {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, index - 1)}
                disabled={index === 0}
                aria-label={`Move ${field.itemLabel.toLowerCase()} up`}
                className="grid h-8 w-8 place-items-center text-[#6c7580] hover:text-[#30363d] disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, index + 1)}
                disabled={index === items.length - 1}
                aria-label={`Move ${field.itemLabel.toLowerCase()} down`}
                className="grid h-8 w-8 place-items-center text-[#6c7580] hover:text-[#30363d] disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => commit(items.filter((_, i) => i !== index))}
                aria-label={`Remove ${field.itemLabel.toLowerCase()}`}
                className="grid h-8 w-8 place-items-center text-[#6c7580] hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {field.itemFields.map(itemField => {
              const update = (next: string) =>
                commit(
                  items.map((current, i) =>
                    i === index
                      ? { ...current, [itemField.name]: next }
                      : current
                  )
                );
              return (
                <label key={itemField.name} className="block">
                  <span className="mb-2 block text-xs font-medium text-[#30363d]">
                    {itemField.label}
                  </span>
                  {itemField.type === "textarea" ||
                  itemField.type === "lines" ? (
                    <textarea
                      value={item[itemField.name] ?? ""}
                      onChange={event => update(event.target.value)}
                      rows={3}
                      className={textareaClass}
                    />
                  ) : (
                    <input
                      value={item[itemField.name] ?? ""}
                      onChange={event => update(event.target.value)}
                      className={inputClass}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => commit([...items, blank()])}
        className="flex h-11 w-full items-center justify-center gap-2 border border-dashed border-[#d9d9d9] text-sm text-[#6c7580] hover:border-[#c76f42] hover:text-[#c76f42]"
      >
        <Plus className="h-4 w-4" /> Add {field.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

export default function AdminWebsite() {
  const { user, loading } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState("");
  const [pathname, navigate] = useLocation();
  const [listView, setListView] = useState<AdminListView>("table");
  const view = parseView(pathname);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const { data: settings, isLoading: settingsLoading } =
    trpc.siteSettings.getAll.useQuery(undefined, {
      enabled: !!user && canAccessAdminDashboard(user.role),
    });
  const { data: meta } = trpc.siteSettings.getAllWithMeta.useQuery(undefined, {
    enabled: !!user && canAccessAdminDashboard(user.role),
  });
  const updateMutation = trpc.siteSettings.update.useMutation();
  const uploadMutation = trpc.upload.image.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!settings) return;
    const next = Object.fromEntries(
      ALL_FIELDS.map(field => [field.key, resolveValue(settings, field)])
    );
    setValues(next);
    setSavedValues(next);
  }, [settings]);

  const changedKeys = useMemo(
    () =>
      ALL_FIELDS.filter(f => values[f.key] !== savedValues[f.key]).map(
        f => f.key
      ),
    [values, savedValues]
  );
  const dirty = changedKeys.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (key: string, value: string) =>
    setValues(current => ({ ...current, [key]: value }));

  /** Saves every unsaved change; `override` applies extra changes first and saves them in the same request. */
  const handleSave = async (
    override?: Record<string, string>
  ): Promise<boolean> => {
    if (isSaving) return false;
    const current = override ? { ...values, ...override } : values;
    const changed = ALL_FIELDS.filter(
      field => current[field.key] !== savedValues[field.key]
    );
    if (!changed.length) return true;
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(
        changed.map(field => {
          const section = V2_SECTIONS.find(s => s.fields.includes(field));
          const value = current[field.key];
          return {
            key: field.key,
            // Matching the fallback means "follow the default", so nothing is pinned.
            value: value === fallbackValue(settings, field) ? null : value,
            type: field.type,
            group: `v2_${section?.id ?? "website"}`,
            label: field.label,
          };
        })
      );
      setValues(current);
      setSavedValues(current);
      await Promise.all([
        utils.siteSettings.getAll.invalidate(),
        utils.siteSettings.getAllWithMeta.invalidate(),
      ]);
      toast.success("Website content saved.");
      return true;
    } catch {
      toast.error("Unable to save website content.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (key: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Images must be smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      setUploadingKey(key);
      try {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          base64,
          filename: file.name,
          contentType: file.type,
        });
        set(key, result.url);
        toast.success("Image uploaded.");
      } catch {
        toast.error("Unable to upload the image.");
      } finally {
        setUploadingKey(null);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading || settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[#747d87]">Loading website content…</p>
      </div>
    );
  }
  if (!user || !canAccessAdminDashboard(user.role)) return null;

  const renderField = (field: V2Field) => {
    const value = values[field.key] ?? "";
    const fallback = fallbackValue(settings, field);
    const canReset = value !== fallback;
    const reset = canReset && (
      <button
        type="button"
        onClick={() => set(field.key, fallback)}
        className="flex items-center gap-1 text-xs text-[#747d87] hover:text-[#c76f42]"
      >
        <RotateCcw className="h-3 w-3" />
        {field.legacyKey ? "Use Site Content value" : "Reset to default"}
      </button>
    );

    if (field.type === "toggle") {
      const on = value !== "false";
      return (
        <div
          key={field.key}
          className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-[var(--admin-card)] px-4 py-3"
        >
          <span className="text-sm font-medium text-[#30363d]">
            {field.label}
          </span>
          <Switch
            checked={on}
            aria-label={field.label}
            onCheckedChange={checked =>
              set(field.key, checked ? "true" : "false")
            }
          />
        </div>
      );
    }

    let control;
    if (field.type === "list") {
      control = (
        <ListEditor
          field={field}
          value={value}
          onChange={next => set(field.key, next)}
        />
      );
    } else if (field.type === "textarea") {
      control = (
        <textarea
          value={value}
          onChange={event => set(field.key, event.target.value)}
          rows={4}
          className={textareaClass}
        />
      );
    } else if (field.type === "image") {
      control = (
        <div className="space-y-3">
          <input
            value={value}
            onChange={event => set(field.key, event.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
          <AdminImageUploader
            value={value}
            label={field.label}
            uploading={uploadingKey === field.key}
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) handleImageUpload(field.key, file);
            }}
            onMediaSelect={url => set(field.key, url)}
            onRemove={() => set(field.key, "")}
          />
        </div>
      );
    } else {
      control = (
        <input
          type={field.type === "url" ? "url" : "text"}
          value={value}
          onChange={event => set(field.key, event.target.value)}
          className={inputClass}
        />
      );
    }

    return (
      <div key={field.key}>
        <div className="mb-2 flex items-center justify-between gap-4">
          <label className="text-sm font-medium text-[#30363d]">
            {field.label}
            {changedKeys.includes(field.key) && (
              <span className="ml-2 text-xs font-normal text-[#c76f42]">
                Unsaved
              </span>
            )}
          </label>
          {reset}
        </div>
        {control}
        {field.help && (
          <p className="mt-1.5 text-xs text-[#747d87]">{field.help}</p>
        )}
      </div>
    );
  };

  const editingPage =
    view.kind === "page"
      ? V2_PAGE_LIST.find(page => page.slug === view.slug)
      : undefined;
  const viewSections = V2_SECTIONS.filter(section =>
    view.kind === "menus"
      ? section.page === "Menus"
      : view.kind === "settings"
        ? section.page === "Site-wide"
        : section.page === editingPage?.title
  );
  const active =
    viewSections.find(section => section.id === activeId) ?? viewSections[0];

  const pageRows = V2_PAGE_LIST.map(page => {
    const sections = V2_SECTIONS.filter(section => section.page === page.title);
    const keys = new Set(
      sections.flatMap(section => section.fields.map(field => field.key))
    );
    const modified = (meta ?? [])
      .filter(row => keys.has(row.settingKey))
      .map(row => new Date(row.updatedAt))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      ...page,
      sections: sections.length,
      modified,
      dirty: sections.some(section =>
        section.fields.some(f => changedKeys.includes(f.key))
      ),
    };
  });

  const pageActions = (page: { slug: string; title: string; url: string }) => (
    <AdminActionsMenu label={`Actions for ${page.title}`}>
      <button
        type="button"
        onClick={() => navigate(`/admin/website/pages/${page.slug}`)}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => window.open(page.url, "_blank", "noopener,noreferrer")}
      >
        View
      </button>
    </AdminActionsMenu>
  );

  const saveBar = (
    <div className="sticky bottom-0 z-10 mt-8 flex flex-wrap items-center gap-3 border-t border-[#e6e6e6] bg-[var(--admin-background,#f8f7ec)] py-4">
      <button
        onClick={() => handleSave()}
        disabled={isSaving || !dirty}
        className="admin-button admin-button-primary min-w-40"
      >
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSaving
          ? "Saving…"
          : view.kind === "page"
            ? "Update"
            : "Save changes"}
      </button>
      <button
        onClick={() => setValues(savedValues)}
        disabled={!dirty}
        className="admin-button admin-button-secondary min-w-40"
      >
        Discard changes
      </button>
      {dirty && (
        <span className="text-sm text-[#747d87]">
          {changedKeys.length} unsaved{" "}
          {changedKeys.length === 1 ? "change" : "changes"}
        </span>
      )}
    </div>
  );

  return (
    <div className="admin-dual-view-page admin-standard-page mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
      <AdminPageHeader
        title={
          editingPage
            ? `Edit Page: ${editingPage.title}`
            : view.kind === "menus"
              ? "Menus"
              : view.kind === "settings"
                ? "Settings"
                : "Pages"
        }
        parent={
          editingPage
            ? { label: "Pages", href: "/admin/website" }
            : { label: "Website", href: "/admin/website" }
        }
        action={
          <div className="flex items-center gap-2">
            {view.kind === "pages" && (
              <AdminViewToggle
                view={listView}
                onChange={setListView}
                label="Pages"
              />
            )}
            <a
              href={editingPage?.url ?? "/"}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-button admin-button-secondary"
            >
              <ExternalLink className="h-4 w-4" />{" "}
              {editingPage ? "View page" : "View website"}
            </a>
          </div>
        }
      />

      {view.kind === "pages" && listView === "grid" ? (
        <div className="admin-view-grid">
          {pageRows.map(page => (
            <div key={page.slug} className="admin-list-card flex flex-col">
              <div className="absolute right-3 top-3 z-20">
                {pageActions(page)}
              </div>
              <span
                className={`admin-status-label absolute left-3 top-3 z-10 ${page.modified ? "" : "inactive"}`}
              >
                {page.modified ? "Customised" : "Default"}
              </span>
              <button
                type="button"
                onClick={() => navigate(`/admin/website/pages/${page.slug}`)}
                aria-label={`Edit ${page.title}`}
                className="admin-list-card-image grid aspect-[16/9] w-full place-items-center"
              >
                <FileText className="h-10 w-10 text-gray-300" />
              </button>
              <div className="flex flex-1 flex-col p-4">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/website/pages/${page.slug}`)}
                  className="truncate text-left font-bold text-gray-900 hover:text-[#c76f42]"
                >
                  {page.title}
                </button>
                <p className="mb-4 mt-1 truncate text-xs text-gray-400">
                  {page.note === "Template" ? `${page.url}/{course}` : page.url}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--admin-border)] pt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" /> {page.sections} sections
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {page.modified
                      ? page.modified.toLocaleDateString("en-GB")
                      : "Not edited yet"}
                  </span>
                  {page.note && <span>{page.note}</span>}
                  {page.dirty && (
                    <span className="text-[#c76f42]">Unsaved</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : view.kind === "pages" ? (
        <div className="overflow-x-auto bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Sections</th>
                <th className="px-4 py-3 font-medium">Last modified</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(page => (
                <tr
                  key={page.slug}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/website/pages/${page.slug}`)
                      }
                      className="text-left hover:text-[#c76f42]"
                    >
                      {page.title}
                    </button>
                    {page.note && (
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        {page.note}
                      </span>
                    )}
                    {page.dirty && (
                      <span className="ml-2 text-xs font-normal text-[#c76f42]">
                        Unsaved
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {page.note === "Template"
                      ? `${page.url}/{course}`
                      : page.url}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{page.sections}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {page.modified
                      ? page.modified.toLocaleDateString("en-GB")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`admin-status-label ${page.modified ? "" : "inactive"}`}
                    >
                      {page.modified ? "Customised" : "Default"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{pageActions(page)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : view.kind === "menus" ? (
        <AdminMenus
          value={parseMenus(values.v2_menus ?? "", V2_FIELDS.v2_menus)}
          onChange={next => set("v2_menus", JSON.stringify(next))}
          onSave={next =>
            handleSave(next ? { v2_menus: JSON.stringify(next) } : undefined)
          }
          saving={isSaving}
        />
      ) : !active ? (
        <p className="text-sm text-[#747d87]">
          Page not found.{" "}
          <Link
            href="/admin/website"
            className="text-[#c76f42] hover:underline"
          >
            Back to all pages
          </Link>
        </p>
      ) : (
        <div className="grid gap-10 md:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
          <nav className="space-y-1 md:sticky md:top-8 md:max-h-[calc(100vh-4rem)] md:self-start md:overflow-y-auto">
            {editingPage && (
              <Link
                href="/admin/website"
                className="mb-4 flex items-center gap-1.5 text-sm text-[#6c7580] hover:text-[#c76f42]"
              >
                <ArrowLeft className="h-4 w-4" /> All pages
              </Link>
            )}
            {viewSections.map(section => {
              const sectionDirty = section.fields.some(f =>
                changedKeys.includes(f.key)
              );
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveId(section.id)}
                  className={`flex h-9 w-full items-center justify-between gap-2 text-left text-sm transition-colors ${active.id === section.id ? "text-[#c76f42]" : "text-[#6c7580] hover:text-[#30363d]"}`}
                >
                  <span className="truncate">{section.title}</span>
                  {sectionDirty && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c76f42]"
                      aria-label="Unsaved changes"
                    />
                  )}
                </button>
              );
            })}
          </nav>
          <main className="min-w-0">
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-[#30363d]">
                  {active.title}
                </h2>
                {active.preview && (
                  <a
                    href={active.preview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-[#6c7580] hover:text-[#c76f42]"
                  >
                    Preview <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <p className="mb-8 mt-1 text-sm text-[#747d87]">
                {active.description}
              </p>
              <div className="space-y-6">{active.fields.map(renderField)}</div>
              {saveBar}
            </section>
          </main>
        </div>
      )}
    </div>
  );
}
