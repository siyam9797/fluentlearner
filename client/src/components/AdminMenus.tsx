"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AdminMenuEditor from "@/components/AdminMenuEditor";
import { V2_MENU_LOCATIONS, type V2Menus } from "@/components/home-v2/content";
import AdminSelect from "@/components/AdminSelect";

const NEW = "__new__";
const inputClass =
  "h-10 border border-[#d9d9d9] bg-white px-3 text-sm outline-none focus:border-[#c76f42]";
const linkButton = "text-[#c76f42] hover:underline";

const newMenuId = () =>
  `menu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * WordPress-style Menus screen: create any number of named menus and choose which one each theme location shows.
 * `onSave` persists; pass the next value when the change should save straight away (create, delete).
 */
export default function AdminMenus({
  value,
  onChange,
  onSave,
  saving,
}: {
  value: V2Menus;
  onChange: (next: V2Menus) => void;
  onSave: (next?: V2Menus) => Promise<boolean>;
  saving: boolean;
}) {
  const { menus, locations } = value;
  const [tab, setTab] = useState<"edit" | "locations">("edit");
  const [selectedId, setSelectedId] = useState<string>(menus[0]?.id ?? NEW);
  const [pickerId, setPickerId] = useState(selectedId);
  const [newName, setNewName] = useState("");
  // Location to assign once the new menu is created ("Use new menu" on Manage Locations).
  const [pendingLocation, setPendingLocation] = useState<string | null>(null);

  const creating =
    selectedId === NEW || !menus.some(menu => menu.id === selectedId);
  const menu = creating ? null : menus.find(item => item.id === selectedId)!;

  useEffect(() => {
    if (!menus.length) setSelectedId(NEW);
  }, [menus.length]);
  // Keep the "Select a menu" dropdown in step with the menu being edited.
  useEffect(
    () => setPickerId(selectedId === NEW ? (menus[0]?.id ?? "") : selectedId),
    [selectedId]
  ); // eslint-disable-line react-hooks/exhaustive-deps

  const locationLabel = (menuId: string) =>
    V2_MENU_LOCATIONS.filter(location => locations[location.id] === menuId).map(
      location => location.label
    );
  const menuName = (menuId: string | null | undefined) =>
    menus.find(item => item.id === menuId)?.name;
  const nameTaken = (name: string, exceptId?: string) =>
    menus.some(
      item =>
        item.id !== exceptId &&
        item.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

  const updateMenu = (patch: Partial<V2Menus["menus"][number]>) =>
    onChange({
      ...value,
      menus: menus.map(item =>
        item.id === selectedId ? { ...item, ...patch } : item
      ),
    });

  const createMenu = async () => {
    const name = newName.trim() || `Menu ${menus.length + 1}`;
    if (nameTaken(name))
      return toast.error(`The menu name “${name}” is already in use.`);
    const id = newMenuId();
    const next: V2Menus = {
      menus: [...menus, { id, name, items: [] }],
      locations: pendingLocation
        ? { ...locations, [pendingLocation]: id }
        : locations,
    };
    if (await onSave(next)) {
      setSelectedId(id);
      setNewName("");
      setPendingLocation(null);
      setTab("edit");
    }
  };

  const saveMenu = async () => {
    if (!menu) return;
    if (!menu.name.trim()) return toast.error("Please enter a menu name.");
    if (nameTaken(menu.name, menu.id))
      return toast.error(`The menu name “${menu.name}” is already in use.`);
    await onSave();
  };

  const deleteMenu = async () => {
    if (
      !menu ||
      !confirm(`You are about to permanently delete “${menu.name}”. Continue?`)
    )
      return;
    const next: V2Menus = {
      menus: menus.filter(item => item.id !== menu.id),
      locations: Object.fromEntries(
        Object.entries(locations).map(([location, id]) => [
          location,
          id === menu.id ? null : id,
        ])
      ),
    };
    if (await onSave(next)) setSelectedId(next.menus[0]?.id ?? NEW);
  };

  const toggleLocation = (locationId: string, checked: boolean) =>
    onChange({
      ...value,
      locations: {
        ...locations,
        [locationId]: checked
          ? selectedId
          : locations[locationId] === selectedId
            ? null
            : locations[locationId],
      },
    });

  const saveButton = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="admin-button admin-button-primary h-10 px-5 text-sm"
    >
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  );

  return (
    <div>
      <nav
        className="mb-6 flex gap-6 border-b border-[#e3e3e3]"
        aria-label="Menus"
      >
        {(
          [
            ["edit", "Edit Menus"],
            ["locations", "Manage Locations"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`-mb-px border-b-2 pb-3 text-sm transition-colors ${tab === id ? "border-[#c76f42] text-[#c76f42]" : "border-transparent text-[#6c7580] hover:text-[#30363d]"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "locations" ? (
        <section>
          <p className="mb-5 text-sm text-[#6c7580]">
            Your theme supports {V2_MENU_LOCATIONS.length} menus. Select which
            menu appears in each location.
          </p>
          <div className="overflow-x-auto bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Theme Location</th>
                  <th className="px-4 py-3 font-medium">Assigned Menu</th>
                </tr>
              </thead>
              <tbody>
                {V2_MENU_LOCATIONS.map(location => {
                  const assigned = locations[location.id] ?? "";
                  return (
                    <tr
                      key={location.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {location.label}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {location.description}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <AdminSelect
                            value={assigned}
                            onChange={event =>
                              onChange({
                                ...value,
                                locations: {
                                  ...locations,
                                  [location.id]: event.target.value || null,
                                },
                              })
                            }
                            aria-label={`Menu for ${location.label}`}
                            className="min-w-[200px]"
                          >
                            <option value="">— Select a Menu —</option>
                            {menus.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </AdminSelect>
                          {assigned && (
                            <button
                              type="button"
                              className={`text-sm ${linkButton}`}
                              onClick={() => {
                                setSelectedId(assigned);
                                setTab("edit");
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {assigned && (
                            <span className="text-[#d9d9d9]">|</span>
                          )}
                          <button
                            type="button"
                            className={`text-sm ${linkButton}`}
                            onClick={() => {
                              setPendingLocation(location.id);
                              setSelectedId(NEW);
                              setTab("edit");
                            }}
                          >
                            Use new menu
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            {saveButton("Save Changes", () => onSave())}
          </div>
        </section>
      ) : (
        <section>
          <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#30363d]">
            {creating ? (
              <span>
                Edit your menu below, or{" "}
                {menus.length > 0 && (
                  <button
                    type="button"
                    className={linkButton}
                    onClick={() => setSelectedId(menus[0].id)}
                  >
                    edit an existing menu
                  </button>
                )}
                {menus.length === 0 && "create your first menu"}. Don't forget
                to save your changes!
              </span>
            ) : (
              <>
                <label htmlFor="menu-picker">Select a menu to edit:</label>
                <AdminSelect
                  id="menu-picker"
                  value={pickerId}
                  onChange={event => setPickerId(event.target.value)}
                  className="min-w-[220px]"
                >
                  {menus.map(item => {
                    const at = locationLabel(item.id);
                    return (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {at.length ? ` (${at.join(", ")})` : ""}
                      </option>
                    );
                  })}
                </AdminSelect>
                <button
                  type="button"
                  onClick={() => setSelectedId(pickerId)}
                  className="admin-button admin-button-secondary h-10 px-4 text-sm"
                >
                  Select
                </button>
                <span>
                  or{" "}
                  <button
                    type="button"
                    className={linkButton}
                    onClick={() => setSelectedId(NEW)}
                  >
                    create a new menu
                  </button>
                  . Don't forget to save your changes!
                </span>
              </>
            )}
          </div>

          <AdminMenuEditor
            key={creating ? NEW : selectedId}
            value={menu?.items ?? []}
            onChange={items => updateMenu({ items })}
            disabled={creating}
            header={
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="menu-name"
                  className="text-sm font-medium text-[#30363d]"
                >
                  Menu Name
                </label>
                <input
                  id="menu-name"
                  value={creating ? newName : menu!.name}
                  onChange={event =>
                    creating
                      ? setNewName(event.target.value)
                      : updateMenu({ name: event.target.value })
                  }
                  onKeyDown={event => {
                    if (event.key === "Enter")
                      creating ? createMenu() : saveMenu();
                  }}
                  placeholder={
                    creating ? `Menu ${menus.length + 1}` : undefined
                  }
                  className={`${inputClass} min-w-0 flex-1`}
                />
                {creating
                  ? saveButton("Create Menu", createMenu)
                  : saveButton("Save Menu", saveMenu)}
              </div>
            }
            footer={
              creating ? (
                <p className="text-sm text-[#747d87]">
                  Give your menu a name, then click Create Menu. You can add
                  items once it is created.
                  {pendingLocation &&
                    ` It will be shown in the ${V2_MENU_LOCATIONS.find(l => l.id === pendingLocation)?.label}.`}
                </p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-sm font-medium text-[#30363d]">
                      Menu Settings
                    </p>
                    <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                      <span className="text-sm text-[#6c7580]">
                        Display location
                      </span>
                      <div className="space-y-2">
                        {V2_MENU_LOCATIONS.map(location => {
                          const current = locations[location.id];
                          const elsewhere =
                            current && current !== selectedId
                              ? menuName(current)
                              : null;
                          return (
                            <label
                              key={location.id}
                              className="flex items-center gap-2 text-sm text-[#30363d]"
                            >
                              <input
                                type="checkbox"
                                checked={current === selectedId}
                                onChange={event =>
                                  toggleLocation(
                                    location.id,
                                    event.target.checked
                                  )
                                }
                                className="accent-[#c76f42]"
                              />
                              {location.label}
                              {elsewhere && (
                                <span className="text-xs text-[#9ba0a6]">
                                  (Currently set to: {elsewhere})
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-t border-[#eeeeee] pt-4">
                    {saveButton("Save Menu", saveMenu)}
                    <button
                      type="button"
                      onClick={deleteMenu}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete Menu
                    </button>
                  </div>
                </div>
              )
            }
          />
        </section>
      )}
    </div>
  );
}
