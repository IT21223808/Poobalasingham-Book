"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Package,
} from "lucide-react";

import {
  createLocation,
  deleteLocation,
  getLocations,
  updateLocation,
  Location,
} from "@/services/inventory.service";

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] =
    useState<Location | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [isActive, setIsActive] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // LOAD LOCATIONS
  // ========================================

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  // ========================================
  // OPEN CREATE
  // ========================================

  const openCreateModal = () => {
    setEditingLocation(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setError("");
    setShowModal(true);
  };

  // ========================================
  // OPEN EDIT
  // ========================================

  const openEditModal = (
    location: Location,
  ) => {
    setEditingLocation(location);
    setName(location.name);
    setDescription(
      location.description ?? "",
    );
    setIsActive(location.isActive);
    setError("");
    setShowModal(true);
  };

  // ========================================
  // SAVE
  // ========================================

  const handleSave = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(
        "Location name is required",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingLocation) {
        await updateLocation(
          editingLocation.id,
          {
            name: name.trim(),
            description:
              description.trim(),
            isActive,
          },
        );
      } else {
        await createLocation({
          name: name.trim(),
          description:
            description.trim(),
          isActive,
        });
      }

      setShowModal(false);
      await loadLocations();
    } catch (err) {
      console.error(err);
      setError(
        "Failed to save location",
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // DELETE
  // ========================================

  const handleDelete = async (
    location: Location,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${location.name}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteLocation(
        location.id,
      );

      await loadLocations();
    } catch (err) {
      console.error(err);

      alert(
        "Unable to delete this location.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Inventory Locations
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your stores, warehouses
            and inventory locations
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={loadLocations}
            className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-600 transition hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw
              size={18}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Location
          </button>

        </div>
      </div>

      {/* ================================= */}
      {/* SUMMARY */}
      {/* ================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <MapPin size={20} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Total Locations
              </p>

              <p className="text-xl font-bold text-slate-900">
                {locations.length}
              </p>
            </div>

          </div>

        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <MapPin size={20} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Active Locations
              </p>

              <p className="text-xl font-bold text-slate-900">
                {
                  locations.filter(
                    (item) =>
                      item.isActive,
                  ).length
                }
              </p>
            </div>

          </div>

        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Package size={20} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Inactive Locations
              </p>

              <p className="text-xl font-bold text-slate-900">
                {
                  locations.filter(
                    (item) =>
                      !item.isActive,
                  ).length
                }
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ================================= */}
      {/* LOCATION TABLE */}
      {/* ================================= */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

        <div className="border-b border-slate-200 px-5 py-4">

          <h2 className="font-semibold text-slate-900">
            Locations
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Stores and warehouses used for
            inventory management
          </p>

        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading locations...
          </div>
        ) : locations.length === 0 ? (
          <div className="p-10 text-center">

            <MapPin
              size={42}
              className="mx-auto mb-3 text-slate-300"
            />

            <p className="font-medium text-slate-600">
              No locations found
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Create your first inventory
              location.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">

                <tr>
                  <th className="px-5 py-3">
                    Location
                  </th>

                  <th className="px-5 py-3">
                    Description
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3">
                    Created
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {locations.map(
                  (location) => (

                    <tr
                      key={location.id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <MapPin
                              size={19}
                            />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {
                                location.name
                              }
                            </p>

                            <p className="text-xs text-slate-400">
                              {location.id}
                            </p>
                          </div>

                        </div>

                      </td>

                      <td className="max-w-sm px-5 py-4 text-sm text-slate-500">
                        {location.description ||
                          "No description"}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            location.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {location.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(
                          location.createdAt ?? Date.now(),
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              openEditModal(
                                location,
                              )
                            }
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >
                            <Pencil
                              size={17}
                            />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                location,
                              )
                            }
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ================================= */}
      {/* MODAL */}
      {/* ================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>
                <h2 className="font-semibold text-slate-900">
                  {editingLocation
                    ? "Edit Location"
                    : "Add Location"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Configure your inventory
                  location
                </p>
              </div>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={19} />
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={handleSave}
              className="space-y-5 p-6"
            >

              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Location Name
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. Main Store"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Describe this location..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4">

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Active Location
                  </p>

                  <p className="text-xs text-slate-500">
                    Allow this location to
                    receive inventory
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) =>
                    setIsActive(
                      e.target.checked,
                    )
                  }
                  className="h-4 w-4 accent-blue-600"
                />

              </label>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingLocation
                      ? "Update Location"
                      : "Create Location"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}