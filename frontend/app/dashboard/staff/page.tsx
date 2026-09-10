"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  Plus,
  Pencil,
  UserCheck,
  UserX,
  Users,
  X,
  Loader2,
  ShieldCheck,
  Building2,
  Monitor,
} from "lucide-react";

import api from "@/services/api";

/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | "OWNER"
  | "MANAGER"
  | "CASHIER"
  | "STAFF"
  | "ADMIN"
  | "USER";

interface Location {
  id: string;
  name: string;
}

interface Till {
  id: number;
  name: string;
  code: string;
  locationId: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  locationId: string | null;
  tillId: number | null;
  location?: Location | null;
  till?: Till | null;
  isActive: boolean;
  createdAt: string;
}

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  locationId: string;
  tillId: string;
  isActive: boolean;
}

/* =========================================================
   ROLE LABEL
========================================================= */

const roleLabel = (role: UserRole) => {
  switch (role) {
    case "OWNER":
      return "Owner";

    case "MANAGER":
      return "Branch Manager";

    case "CASHIER":
      return "Cashier";

    case "STAFF":
      return "Staff";

    case "ADMIN":
      return "Admin";

    default:
      return "User";
  }
};

/* =========================================================
   ROLE BADGE
========================================================= */

const roleBadgeClass = (role: UserRole) => {
  switch (role) {
    case "OWNER":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "MANAGER":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "CASHIER":
      return "bg-green-50 text-green-700 border-green-200";

    case "STAFF":
      return "bg-gray-50 text-gray-700 border-gray-200";

    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
};

/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm: UserForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "STAFF",
  locationId: "",
  tillId: "",
  isActive: true,
};

/* =========================================================
   PAGE
========================================================= */

export default function StaffPage() {
  const [users, setUsers] = useState<User[]>([]);

  const [locations, setLocations] =
    useState<Location[]>([]);

  const [tills, setTills] = useState<Till[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState<"ALL" | UserRole>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">(
      "ALL",
    );

  const [showModal, setShowModal] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [form, setForm] =
    useState<UserForm>(emptyForm);

  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     NORMALIZE API ARRAY
  ======================================================= */

  const extractArray = <T,>(
    responseData: unknown,
    keys: string[] = [],
  ): T[] => {
    if (Array.isArray(responseData)) {
      return responseData as T[];
    }

    if (
      responseData &&
      typeof responseData === "object"
    ) {
      const data =
        responseData as Record<
          string,
          unknown
        >;

      for (const key of keys) {
        if (Array.isArray(data[key])) {
          return data[key] as T[];
        }
      }

      if (
        data.data &&
        Array.isArray(data.data)
      ) {
        return data.data as T[];
      }
    }

    return [];
  };

  /* =======================================================
     LOAD USERS
  ======================================================= */

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/users");

      const userList = extractArray<User>(
        response.data,
        [
          "users",
          "items",
          "results",
        ],
      );

      setUsers(
        Array.isArray(userList)
          ? userList
          : [],
      );
    } catch (err: any) {
      console.error(
        "Failed to load users:",
        err,
      );

      setUsers([]);

      setError(
        err?.response?.data?.message ||
          "Failed to load users.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD LOCATIONS
  ======================================================= */

  const loadLocations = async () => {
    try {
      const response =
        await api.get(
          "/inventory/locations",
        );

      const locationList =
        extractArray<Location>(
          response.data,
          [
            "locations",
            "items",
            "results",
          ],
        );

      /*
       * IMPORTANT:
       * locations state will ALWAYS receive
       * an array.
       */

      setLocations(
        Array.isArray(locationList)
          ? locationList
          : [],
      );

      console.log(
        "Locations loaded:",
        locationList,
      );
    } catch (err: any) {
      console.error(
        "Failed to load locations:",
        err,
      );

      setLocations([]);
    }
  };

  /* =======================================================
     LOAD TILLS
  ======================================================= */

  const loadTills = async () => {
    try {
      const response =
        await api.get("/tills");

      const tillList =
        extractArray<Till>(
          response.data,
          [
            "tills",
            "items",
            "results",
          ],
        );

      setTills(
        Array.isArray(tillList)
          ? tillList
          : [],
      );
    } catch (err: any) {
      console.error(
        "Failed to load tills:",
        err,
      );

      setTills([]);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadUsers();
    loadLocations();
    loadTills();
  }, []);

  /* =======================================================
     FILTERED USERS
  ======================================================= */

  const filteredUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const fullName =
        `${user.firstName ?? ""} ${
          user.lastName ?? ""
        }`.toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        user.email
          ?.toLowerCase()
          .includes(query) ||
        user.role
          ?.toLowerCase()
          .includes(query) ||
        user.location?.name
          ?.toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          user.isActive) ||
        (statusFilter === "INACTIVE" &&
          !user.isActive);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  /* =======================================================
     STATS
  ======================================================= */

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.isActive,
  ).length;

  const inactiveUsers =
    users.filter(
      (user) => !user.isActive,
    ).length;

  /* =======================================================
     OPEN ADD
  ======================================================= */

  const openAddModal = () => {
    setEditingUser(null);

    setForm({
      ...emptyForm,
      role: "STAFF",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  const openEditModal = (
    user: User,
  ) => {
    setEditingUser(user);

    setForm({
      firstName:
        user.firstName ?? "",

      lastName:
        user.lastName ?? "",

      email:
        user.email ?? "",

      password: "",

      role:
        user.role,

      locationId:
        user.locationId ?? "",

      tillId:
        user.tillId
          ? String(user.tillId)
          : "",

      isActive:
        user.isActive,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingUser(null);
    setForm({
      ...emptyForm,
    });
    setError("");
  };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const updateForm = <
    K extends keyof UserForm,
  >(
    key: K,
    value: UserForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  /* =======================================================
     ROLE CHANGE
  ======================================================= */

  const handleRoleChange = (
    role: UserRole,
  ) => {
    setForm((previous) => ({
      ...previous,

      role,

      /*
       * Owner does not need branch selection.
       * Backend handles owner assignment.
       */

      locationId:
        role === "OWNER"
          ? ""
          : previous.locationId,

      /*
       * Only cashier requires till.
       */

      tillId:
        role === "CASHIER"
          ? previous.tillId
          : "",
    }));
  };

  /* =======================================================
     AVAILABLE TILLS
  ======================================================= */

  const availableTills = useMemo(() => {
    /*
     * No branch selected:
     * show all tills.
     */

    if (!form.locationId) {
      return Array.isArray(tills)
        ? tills
        : [];
    }

    return (
      Array.isArray(tills)
        ? tills
        : []
    ).filter(
      (till) =>
        till.locationId ===
        form.locationId,
    );
  }, [
    tills,
    form.locationId,
  ]);

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /* -----------------------------------------------
         VALIDATION
      ----------------------------------------------- */

      if (!form.firstName.trim()) {
        throw new Error(
          "First name is required.",
        );
      }

      if (!form.lastName.trim()) {
        throw new Error(
          "Last name is required.",
        );
      }

      if (!form.email.trim()) {
        throw new Error(
          "Email is required.",
        );
      }

      if (
        !editingUser &&
        !form.password
      ) {
        throw new Error(
          "Password is required.",
        );
      }

      if (
        !editingUser &&
        form.password.length < 6
      ) {
        throw new Error(
          "Password must contain at least 6 characters.",
        );
      }

      if (
        form.role !== "OWNER" &&
        !form.locationId
      ) {
        throw new Error(
          "Please select a branch.",
        );
      }

      if (
        form.role === "CASHIER" &&
        !form.tillId
      ) {
        throw new Error(
          "Please select a till for the cashier.",
        );
      }

      /* -----------------------------------------------
         PAYLOAD
      ----------------------------------------------- */

      const payload: Record<
        string,
        unknown
      > = {
        firstName:
          form.firstName.trim(),

        lastName:
          form.lastName.trim(),

        email:
          form.email.trim(),

        role:
          form.role,

        isActive:
          form.isActive,
      };

      /* -----------------------------------------------
         PASSWORD
      ----------------------------------------------- */

      if (form.password.trim()) {
        payload.password =
          form.password;
      }

      /* -----------------------------------------------
         LOCATION
      ----------------------------------------------- */

      if (form.role !== "OWNER") {
        payload.locationId =
          form.locationId;
      } else {
        payload.locationId = null;
      }

      /* -----------------------------------------------
         TILL
      ----------------------------------------------- */

      if (form.role === "CASHIER") {
        payload.tillId =
          Number(form.tillId);
      } else {
        payload.tillId = null;
      }

      /* -----------------------------------------------
         CREATE
      ----------------------------------------------- */

      if (!editingUser) {
        await api.post(
          "/users",
          payload,
        );

        setSuccess(
          "User created successfully.",
        );
      }

      /* -----------------------------------------------
         UPDATE
      ----------------------------------------------- */

      else {
        await api.patch(
          `/users/${editingUser.id}`,
          payload,
        );

        setSuccess(
          "User updated successfully.",
        );
      }

      /* -----------------------------------------------
         REFRESH USERS
      ----------------------------------------------- */

      await loadUsers();

      setShowModal(false);
      setEditingUser(null);
      setForm({
        ...emptyForm,
      });
    } catch (err: any) {
      console.error(
        "Failed to save user:",
        err,
      );

      const message =
        err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message ||
              err?.message ||
              "Failed to save user.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     TOGGLE STATUS
  ======================================================= */

  const toggleStatus = async (
    user: User,
  ) => {
    try {
      setError("");
      setSuccess("");

      if (user.isActive) {
        await api.patch(
          `/users/${user.id}/deactivate`,
        );

        setSuccess(
          `${user.firstName} has been deactivated.`,
        );
      } else {
        await api.patch(
          `/users/${user.id}/activate`,
        );

        setSuccess(
          `${user.firstName} has been activated.`,
        );
      }

      await loadUsers();
    } catch (err: any) {
      console.error(
        "Failed to update status:",
        err,
      );

      const message =
        err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message ||
              "Failed to update user status.",
      );
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-gray-50 p-6">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <Users
                size={22}
                className="text-blue-700"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Staff & Access
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage all ERP users, roles,
                branches and access.
              </p>
            </div>

          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />

          Add User
        </button>

      </div>

      {/* ===================================================
          ALERTS
      =================================================== */}

      {success && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ===================================================
          STATS
      =================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Total Users
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalUsers}
              </p>
            </div>

            <Users
              size={22}
              className="text-blue-600"
            />

          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Active
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {activeUsers}
              </p>
            </div>

            <UserCheck
              size={22}
              className="text-green-600"
            />

          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Inactive
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {inactiveUsers}
              </p>
            </div>

            <UserX
              size={22}
              className="text-red-600"
            />

          </div>
        </div>

      </div>

      {/* ===================================================
          FILTERS
      =================================================== */}

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

          {/* Search */}

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search name, email, role..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* Role */}

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value as
                  | "ALL"
                  | UserRole,
              )
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">
              All Roles
            </option>

            <option value="OWNER">
              Owner
            </option>

            <option value="MANAGER">
              Branch Manager
            </option>

            <option value="CASHIER">
              Cashier
            </option>

            <option value="STAFF">
              Staff
            </option>
          </select>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | "ACTIVE"
                  | "INACTIVE",
              )
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">
              All Status
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>
          </select>

        </div>
      </div>

      {/* ===================================================
          TABLE
      =================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        {loading ? (

          <div className="flex min-h-[300px] items-center justify-center">

            <div className="flex items-center gap-2 text-sm text-gray-500">

              <Loader2
                size={20}
                className="animate-spin"
              />

              Loading users...

            </div>

          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">

              <Users
                size={25}
                className="text-gray-400"
              />

            </div>

            <h3 className="font-semibold text-gray-800">
              No users found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or
              filters.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead>

                <tr className="border-b border-gray-200 bg-gray-50 text-left">

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    User
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Role
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Branch
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Till
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredUsers.map(
                  (user) => (

                    <tr
                      key={user.id}
                      className="transition hover:bg-gray-50"
                    >

                      {/* User */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">

                            {user.firstName?.charAt(
                              0,
                            )}

                            {user.lastName?.charAt(
                              0,
                            )}

                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-semibold text-gray-900">
                              {user.firstName}{" "}
                              {user.lastName}
                            </p>

                            <p className="truncate text-sm text-gray-500">
                              {user.email}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Role */}

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(
                            user.role,
                          )}`}
                        >
                          {roleLabel(
                            user.role,
                          )}
                        </span>

                      </td>

                      {/* Branch */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2 text-sm text-gray-600">

                          <Building2
                            size={16}
                            className="text-gray-400"
                          />

                          {user.location
                            ?.name ||
                            "—"}

                        </div>

                      </td>

                      {/* Till */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2 text-sm text-gray-600">

                          {user.till ? (
                            <>
                              <Monitor
                                size={16}
                                className="text-gray-400"
                              />

                              <span>
                                {
                                  user
                                    .till
                                    .name
                                }
                              </span>
                            </>
                          ) : (
                            "—"
                          )}

                        </div>

                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">

                        {user.isActive ? (

                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600">

                            <span className="h-2 w-2 rounded-full bg-green-500" />

                            Active

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">

                            <span className="h-2 w-2 rounded-full bg-red-500" />

                            Inactive

                          </span>

                        )}

                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                user,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                          >

                            <Pencil
                              size={14}
                            />

                            Edit

                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(
                                user,
                              )
                            }
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              user.isActive
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >

                            {user.isActive ? (
                              <>
                                <UserX
                                  size={14}
                                />

                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck
                                  size={14}
                                />

                                Activate
                              </>
                            )}

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

      {/* ===================================================
          ADD / EDIT MODAL
      =================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  {editingUser
                    ? "Edit User"
                    : "Add User"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage user access,
                  branch and role.
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* Modal Body */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {error && (

                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>

              )}

              {/* Name */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    First Name
                  </label>

                  <input
                    type="text"
                    value={
                      form.firstName
                    }
                    onChange={(event) =>
                      updateForm(
                        "firstName",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="First name"
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Last Name
                  </label>

                  <input
                    type="text"
                    value={
                      form.lastName
                    }
                    onChange={(event) =>
                      updateForm(
                        "lastName",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Last name"
                  />

                </div>

              </div>

              {/* Email */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateForm(
                      "email",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="user@example.com"
                />

              </div>

              {/* Password */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">

                  Password

                  {editingUser && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      Leave empty to keep
                      current password
                    </span>
                  )}

                </label>

                <input
                  type="password"
                  value={
                    form.password
                  }
                  onChange={(event) =>
                    updateForm(
                      "password",
                      event.target.value,
                    )
                  }
                  minLength={6}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder={
                    editingUser
                      ? "••••••••"
                      : "Minimum 6 characters"
                  }
                />

              </div>

              {/* Role */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Role
                </label>

                <select
                  value={form.role}
                  onChange={(event) =>
                    handleRoleChange(
                      event.target
                        .value as UserRole,
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >

                  <option value="OWNER">
                    Owner
                  </option>

                  <option value="MANAGER">
                    Branch Manager
                  </option>

                  <option value="CASHIER">
                    Cashier
                  </option>

                  <option value="STAFF">
                    Staff
                  </option>

                </select>

              </div>

              {/* Branch */}

              {form.role !== "OWNER" && (

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Branch
                  </label>

                  <select
                    value={
                      form.locationId
                    }
                    onChange={(event) =>
                      updateForm(
                        "locationId",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="">
                      Select branch
                    </option>

                    {Array.isArray(
                      locations,
                    ) &&
                      locations.map(
                        (location) => (
                          <option
                            key={
                              location.id
                            }
                            value={
                              location.id
                            }
                          >
                            {
                              location.name
                            }
                          </option>
                        ),
                      )}

                  </select>

                </div>

              )}

              {/* Owner Information */}

              {form.role === "OWNER" && (

                <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">

                  <div className="flex items-start gap-2">

                    <ShieldCheck
                      size={18}
                      className="mt-0.5 shrink-0"
                    />

                    <div>

                      <p className="font-semibold">
                        Owner access
                      </p>

                      <p className="mt-1 text-xs">
                        Owner will automatically
                        be assigned to the Main
                        Branch by the backend.
                      </p>

                    </div>

                  </div>

                </div>

              )}

              {/* Till */}

              {form.role ===
                "CASHIER" && (

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Till
                  </label>

                  <select
                    value={
                      form.tillId
                    }
                    onChange={(event) =>
                      updateForm(
                        "tillId",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="">
                      Select till
                    </option>

                    {Array.isArray(
                      availableTills,
                    ) &&
                      availableTills.map(
                        (till) => (
                          <option
                            key={
                              till.id
                            }
                            value={
                              till.id
                            }
                          >
                            {
                              till.name
                            }{" "}
                            (
                            {
                              till.code
                            }
                            )
                          </option>
                        ),
                      )}

                  </select>

                </div>

              )}

              {/* Status */}

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4">

                <input
                  type="checkbox"
                  checked={
                    form.isActive
                  }
                  onChange={(event) =>
                    updateForm(
                      "isActive",
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <div>

                  <p className="text-sm font-semibold text-gray-800">
                    Active user
                  </p>

                  <p className="text-xs text-gray-500">
                    User can login when
                    active.
                  </p>

                </div>

              </label>

              {/* Actions */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {editingUser
                    ? "Update User"
                    : "Create User"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}