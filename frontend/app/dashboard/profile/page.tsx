"use client";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  User,
  Mail,
  ShieldCheck,
  MapPin,
  CreditCard,
  Pencil,
  Save,
  X,
  CheckCircle2,
  Briefcase,
  ChevronRight,
  Lock,
} from "lucide-react";

interface StoredUser {
  id?: number;

  firstName?: string;
  lastName?: string;

  email?: string;
  role?: string;

  locationId?: string | null;
  tillId?: number | null;

  location?: {
    id: string;
    name: string;
  } | null;

  till?: {
    id: number;
    name: string;
    code: string;
  } | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null);

  const [isEditing, setIsEditing] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [saving, setSaving] = useState(false);

  /* =========================================================
     LOAD USER
  ========================================================= */

  const loadUser = () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setUser(null);
        return;
      }

      const parsedUser: StoredUser = JSON.parse(storedUser);

      setUser(parsedUser);

      setFirstName(parsedUser.firstName ?? "");
      setLastName(parsedUser.lastName ?? "");
    } catch (error) {
      console.error("Failed to load user:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();

    const handleUserUpdated = () => {
      loadUser();
    };

    window.addEventListener(
      "userUpdated",
      handleUserUpdated
    );

    return () => {
      window.removeEventListener(
        "userUpdated",
        handleUserUpdated
      );
    };
  }, []);

  /* =========================================================
     FULL NAME
  ========================================================= */

  const fullName = useMemo(() => {
    const name = `${user?.firstName ?? ""} ${
      user?.lastName ?? ""
    }`.trim();

    return name || "User";
  }, [user]);

  /* =========================================================
     INITIALS
  ========================================================= */

  const initials = useMemo(() => {
    const name = fullName.trim();

    if (!name) {
      return "U";
    }

    const parts = name
      .split(" ")
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`
      .toUpperCase();
  }, [fullName]);

  /* =========================================================
     ROLE LABEL
  ========================================================= */

  const roleLabel = useMemo(() => {
    const role = user?.role?.toUpperCase();

    switch (role) {
      case "ADMIN":
        return "Administrator";

      case "OWNER":
        return "Owner";

      case "USER":
        return "Owner";

      case "MANAGER":
        return "Branch Manager";

      case "CASHIER":
        return "Cashier";

      case "STAFF":
        return "Staff";

      case "ACCOUNTANT":
        return "Accountant";

      default:
        return "User";
    }
  }, [user?.role]);

  /* =========================================================
     LOCATION
  ========================================================= */

  const locationName =
    user?.location?.name ||
    user?.locationId ||
    "Not assigned";

  /* =========================================================
     TILL
  ========================================================= */

  const tillName =
    user?.till?.name ||
    (user?.tillId
      ? `Till ${user.tillId}`
      : "Not assigned");

  const tillCode =
    user?.till?.code || null;

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  const handleSave = async () => {
    if (!user) {
      return;
    }

    setSaving(true);

    try {
      const updatedUser: StoredUser = {
        ...user,

        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setUser(updatedUser);

      setIsEditing(false);

      /*
       * Notify header / profile dropdown
       * so it can update without page refresh.
       */
      window.dispatchEvent(
        new Event("userUpdated")
      );
    } catch (error) {
      console.error(
        "Failed to save profile:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     CANCEL EDIT
  ========================================================= */

  const handleCancel = () => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");

    setIsEditing(false);
  };

  /* =========================================================
     LOADING / NO USER
  ========================================================= */

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <User
                  size={22}
                  className="text-slate-500"
                />
              </div>

              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  Profile
                </h1>

                <p className="text-sm text-slate-500">
                  No logged-in user information found.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ===================================================
            BREADCRUMB
        =================================================== */}

        <div className="mb-6 flex items-center gap-2 text-sm">
         <Link href="/dashboard" className="text-slate-500 transition hover:text-slate-900" > Dashboard </Link>

          <ChevronRight
            size={15}
            className="text-slate-400"
          />

          <span className="font-medium text-slate-900">
            Profile
          </span>
        </div>

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account information and ERP access details.
          </p>
        </div>

        {/* ===================================================
            PROFILE HEADER CARD
        =================================================== */}

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              {/* USER */}
              <div className="flex items-center gap-4">

                {/* AVATAR */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-bold text-white shadow-sm">
                  {initials}
                </div>

                {/* DETAILS */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {fullName}
                  </h2>

                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <Mail size={15} />

                    <span>
                      {user.email || "No email"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">

                    {/* ROLE */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <ShieldCheck size={14} />
                      {roleLabel}
                    </span>

                    {/* ACTIVE */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={14} />
                      Active
                    </span>

                  </div>
                </div>
              </div>

              {/* EDIT BUTTON */}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isEditing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil size={16} />
                Edit Profile
              </button>

            </div>
          </div>
        </div>

        {/* ===================================================
            SUMMARY CARDS
        =================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* ROLE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  System Role
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {roleLabel}
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-3">
                <Briefcase
                  size={20}
                  className="text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Branch / Location
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {locationName}
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-3">
                <MapPin
                  size={20}
                  className="text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* TILL */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  POS Till
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {tillName}
                </p>

                {tillCode && (
                  <p className="mt-1 text-xs text-slate-500">
                    Code: {tillCode}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-slate-100 p-3">
                <CreditCard
                  size={20}
                  className="text-slate-600"
                />
              </div>
            </div>
          </div>

        </div>

        {/* ===================================================
            MAIN GRID
        =================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Personal Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your basic account information.
                </p>
              </div>

              <User
                size={20}
                className="text-slate-400"
              />
            </div>

            {/* CONTENT */}
            <div className="p-6">

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* FIRST NAME */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    First Name
                  </label>

                  <input
                    type="text"
                    value={firstName}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-80"
                    placeholder="First name"
                  />
                </div>

                {/* LAST NAME */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Last Name
                  </label>

                  <input
                    type="text"
                    value={lastName}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-80"
                    placeholder="Last name"
                  />
                </div>

                {/* EMAIL */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      value={user.email ?? ""}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-600 outline-none disabled:cursor-not-allowed"
                      placeholder="Email address"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Email address is managed by the system.
                  </p>
                </div>

              </div>

              {/* EDIT ACTIONS */}
              {isEditing && (
                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <X size={16} />
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} />

                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>
              )}

            </div>
          </div>

          {/* =================================================
              SECURITY
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Security
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Account security settings.
                  </p>
                </div>

                <Lock
                  size={20}
                  className="text-slate-400"
                />
              </div>
            </div>

            <div className="p-6">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">

                  <div className="rounded-lg bg-white p-2 shadow-sm">
                    <ShieldCheck
                      size={18}
                      className="text-slate-600"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Account Protected
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your account is protected by the ERP authentication system.
                    </p>
                  </div>

                </div>
              </div>

              <div className="mt-4 space-y-3">

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-500">
                    Role
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {roleLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-500">
                    Status
                  </span>

                  <span className="text-sm font-semibold text-emerald-600">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    User ID
                  </span>

                  <span className="max-w-[140px] truncate text-sm font-semibold text-slate-900">
                    {user.id ?? "N/A"}
                  </span>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ===================================================
            WORK INFORMATION
        =================================================== */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-bold text-slate-900">
              Work Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your ERP branch and POS assignment details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">

            {/* LOCATION */}
            <div className="rounded-xl border border-slate-200 p-5">

              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-3">
                  <MapPin
                    size={19}
                    className="text-slate-600"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Branch / Location
                  </p>

                  <p className="text-xs text-slate-500">
                    Assigned working location
                  </p>
                </div>
              </div>

              <p className="text-base font-bold text-slate-900">
                {locationName}
              </p>

              {user.locationId && (
                <p className="mt-1 text-xs text-slate-500">
                  Location ID: {user.locationId}
                </p>
              )}

            </div>

            {/* TILL */}
            <div className="rounded-xl border border-slate-200 p-5">

              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-3">
                  <CreditCard
                    size={19}
                    className="text-slate-600"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    POS Till
                  </p>

                  <p className="text-xs text-slate-500">
                    Assigned point-of-sale terminal
                  </p>
                </div>
              </div>

              <p className="text-base font-bold text-slate-900">
                {tillName}
              </p>

              {tillCode && (
                <p className="mt-1 text-xs text-slate-500">
                  Till Code: {tillCode}
                </p>
              )}

              {user.tillId && (
                <p className="mt-1 text-xs text-slate-500">
                  Till ID: {user.tillId}
                </p>
              )}

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
