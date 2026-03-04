"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Wrench,
  LogOut,
  LogIn,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import Swal from "sweetalert2";
import { useLocale } from "@/hooks/use-locale";

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  serialNumber?: string;
  quantity: number;
  availableQuantity: number;
  location: string;
  condition: string;
  status: string;
  purchaseDate?: string;
  purchasePrice?: number;
  vendor?: string;
  warrantyExpiry?: string;
  assignedTo?: { name: string };
  imageUrl?: string;
  maintenanceCount: number;
  checkoutCount: number;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "", label: "inventory.allCategories" },
  { value: "lab_equipment", label: "inventory.labEquipment" },
  { value: "sports", label: "inventory.sports" },
  { value: "furniture", label: "inventory.furniture" },
  { value: "electronics", label: "inventory.electronics" },
  { value: "stationery", label: "inventory.stationery" },
  { value: "library", label: "inventory.library" },
  { value: "other", label: "inventory.other" },
];

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  checked_out: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300",
  maintenance: "bg-yellow-100 text-yellow-700",
  retired: "bg-muted text-foreground",
};

const CONDITION_COLORS: Record<string, string> = {
  new: "text-green-600",
  good: "text-orange-500 dark:text-orange-400",
  fair: "text-yellow-600",
  poor: "text-orange-600",
  damaged: "text-red-600",
};

export default function InventoryPage() {
  const { t } = useLocale();
  const { data: session } = useSession();
  const { canAdd, canEdit, canDelete } = usePermissions("inventory");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [summary, setSummary] = useState<Record<string, unknown>>({});

  const [form, setForm] = useState({
    name: "",
    category: "lab_equipment",
    serialNumber: "",
    quantity: 1,
    location: "",
    condition: "new",
    purchasePrice: 0,
    vendor: "",
    warrantyExpiry: "",
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      const res = await fetch(`/api/inventory?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.data);
        setSummary(data.summary || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async () => {
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({
          name: "",
          category: "lab_equipment",
          serialNumber: "",
          quantity: 1,
          location: "",
          condition: "new",
          purchasePrice: 0,
          vendor: "",
          warrantyExpiry: "",
        });
        fetchItems();
        Swal.fire({
          icon: "success",
          title: t("inventory.itemAdded"),
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (id: string, action: string) => {
    const notes =
      action === "checkout"
        ? (
            await Swal.fire({
              input: "text",
              title: t("inventory.checkoutNotes"),
              inputPlaceholder: t("inventory.purposePlaceholder"),
            })
          ).value
        : "";
    const description =
      action === "maintenance"
        ? (await Swal.fire({ input: "text", title: t("inventory.maintenanceDescription") }))
            .value
        : "";

    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id, action, notes, description }),
      });
      if (res.ok) fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetire = async (id: string) => {
    const result = await Swal.fire({
      title: t("inventory.retireConfirm"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
    });
    if (result.isConfirmed) {
      await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
      fetchItems();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground flex items-center gap-2">
            <Package className="h-7 w-7 text-orange-500 dark:text-orange-400" /> {t("nav.inventory")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("inventory.description")}
          </p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> {t("inventory.addItem")}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-muted-foreground">{t("inventory.totalItems")}</p>
          <p className="text-2xl font-bold">
            {((summary as Record<string, unknown>).totalItems as number) || 0}
          </p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-muted-foreground">{t("inventory.totalValue")}</p>
          <p className="text-2xl font-bold text-green-600">
            ₹
            {(
              ((summary as Record<string, unknown>).totalValue as number) || 0
            ).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-muted-foreground">{t("inventory.available")}</p>
          <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">
            {(summary as Record<string, Record<string, number>>).statuses
              ?.available || 0}
          </p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-muted-foreground">{t("inventory.inMaintenance")}</p>
          <p className="text-2xl font-bold text-yellow-600">
            {(summary as Record<string, Record<string, number>>).statuses
              ?.maintenance || 0}
          </p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-card rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold mb-4">{t("inventory.addNewItem")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder={t("inventory.itemNamePlaceholder")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
            >
              {CATEGORIES.slice(1).map((c) => (
                <option key={c.value} value={c.value}>
                  {t(c.label)}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t("inventory.serialNumber")}
              value={form.serialNumber}
              onChange={(e) =>
                setForm({ ...form, serialNumber: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
            />
            <input
              type="number"
              placeholder={t("inventory.quantity")}
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: Number(e.target.value) })
              }
              className="border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
              min={1}
            />
            <input
              type="text"
              placeholder={t("inventory.locationPlaceholder")}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
            />
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
            >
              <option value="new">{t("inventory.conditionNew")}</option>
              <option value="good">{t("inventory.conditionGood")}</option>
              <option value="fair">{t("inventory.conditionFair")}</option>
              <option value="poor">{t("inventory.conditionPoor")}</option>
            </select>
            <input
              type="number"
              placeholder={t("inventory.purchasePrice")}
              value={form.purchasePrice || ""}
              onChange={(e) =>
                setForm({ ...form, purchasePrice: Number(e.target.value) })
              }
              className="border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
            />
            <input
              type="text"
              placeholder={t("inventory.vendor")}
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
            />
            <input
              type="date"
              placeholder={t("inventory.warrantyExpiry")}
              value={form.warrantyExpiry}
              onChange={(e) =>
                setForm({ ...form, warrantyExpiry: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleAdd}
              disabled={!form.name || !form.location}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {t("inventory.saveItem")}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border px-4 py-2 rounded-lg text-sm hover:bg-muted/50 dark:hover:bg-gray-700"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("inventory.searchItems")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {t(c.label)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm dark:bg-card dark:border-border"
        >
          <option value="">{t("inventory.allStatus")}</option>
          <option value="available">{t("inventory.statusAvailable")}</option>
          <option value="checked_out">{t("inventory.statusCheckedOut")}</option>
          <option value="maintenance">{t("inventory.statusMaintenance")}</option>
          <option value="retired">{t("inventory.statusRetired")}</option>
        </select>
      </div>

      {/* Items Table */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 dark:bg-card">
              <tr>
                <th className="p-3 text-left font-medium">{t("inventory.item")}</th>
                <th className="p-3 text-left font-medium">{t("inventory.category")}</th>
                <th className="p-3 text-center font-medium">{t("inventory.qty")}</th>
                <th className="p-3 text-center font-medium">{t("inventory.available")}</th>
                <th className="p-3 text-left font-medium">{t("inventory.location")}</th>
                <th className="p-3 text-center font-medium">{t("inventory.condition")}</th>
                <th className="p-3 text-center font-medium">{t("inventory.status")}</th>
                <th className="p-3 text-center font-medium">{t("inventory.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item._id}
                  className="border-t hover:bg-muted/50 dark:hover:bg-gray-750"
                >
                  <td className="p-3">
                    <div className="font-medium">{item.name}</div>
                    {item.serialNumber && (
                      <div className="text-xs text-muted-foreground">
                        {t("inventory.snPrefix")} {item.serialNumber}
                      </div>
                    )}
                    {item.purchasePrice ? (
                      <div className="text-xs text-green-600">
                        ₹{item.purchasePrice.toLocaleString("en-IN")}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 capitalize">
                    {item.category.replace(/_/g, " ")}
                  </td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-center font-semibold">
                    {item.availableQuantity}
                  </td>
                  <td className="p-3">{item.location}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`capitalize ${CONDITION_COLORS[item.condition] || ""}`}
                    >
                      {item.condition}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || "bg-muted"}`}
                    >
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit && item.status === "available" && (
                        <button
                          onClick={() => handleAction(item._id, "checkout")}
                          className="p-1.5 hover:bg-orange-50 rounded text-orange-500 dark:text-orange-400"
                          title={t("inventory.checkout")}
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                      )}
                      {canEdit && item.status === "checked_out" && (
                        <button
                          onClick={() => handleAction(item._id, "return")}
                          className="p-1.5 hover:bg-green-50 rounded text-green-600"
                          title={t("inventory.return")}
                        >
                          <LogIn className="h-4 w-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleAction(item._id, "maintenance")}
                          className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600"
                          title={t("inventory.maintenance")}
                        >
                          <Wrench className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleRetire(item._id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-600"
                          title={t("inventory.retire")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              {t("inventory.noItems")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
