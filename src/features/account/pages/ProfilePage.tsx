import { FormEvent, useEffect, useRef, useState, ChangeEvent } from "react";
import { useAppSelector } from "@/app/hooks";
import {
  Camera,
  ChevronDown,
  Loader2,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ChangeEmailModal from "../components/ChangeEmailModal";
import ChangePasswordModal from "../components/ChangePasswordModal";
import ChangePhoneModal from "../components/ChangePhoneModal";
import SetPasswordModal from "../components/SetPasswordModal";
import SetPhoneModal from "../components/SetPhoneModal";
import { authFeatureApi } from "@/features/auth/api/authApi";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const parseDateOfBirth = (value: string | null | undefined) => {
  const date = value?.slice(0, 10);
  if (!date) return { day: "", month: "", year: "" };

  const [year, month, day] = date.split("-");
  const monthName = month ? MONTHS[Number(month) - 1] : undefined;

  return year && day && monthName
    ? { day: String(Number(day)), month: monthName, year }
    : { day: "", month: "", year: "" };
};

const ProfilePage = () => {
  const { user } = useAppSelector((s) => s.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hasPassword, setHasPassword] = useState(true);

  const [gender, setGender] = useState<"" | "male" | "female" | "other">("");
  const [dob, setDob] = useState({ day: "", month: "", year: "" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSetPhoneModalOpen, setIsSetPhoneModalOpen] = useState(false);
  const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const username = user?.name ?? "thatnaing tun";

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
    if (user?.image) setAvatarPreview(user.image);
    if (user?.phone) setPhone(user.phone);
    if (user?.gender) setGender(user.gender);
    if (user?.date_of_birth) {
      setDob(parseDateOfBirth(user.date_of_birth));
    }
    if (typeof user?.hasPassword === "boolean") {
      setHasPassword(user.hasPassword);
    }
  }, [user]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("File size exceeds 1 MB.");
        return;
      }

      setAvatarPreview(URL.createObjectURL(file));
      setAvatarFile(file);
      setSaveError(null);
      setSaveSuccess(null);
    }

    e.target.value = "";
  };

  const handleReset = () => {
    setName(user?.name ?? "");
    setGender(user?.gender ?? "");

    if (user?.date_of_birth) {
      setDob(parseDateOfBirth(user.date_of_birth));
    } else {
      setDob({ day: "", month: "", year: "" });
    }
    setAvatarPreview(user?.image ?? null);
    setAvatarFile(null);
    setSaveError(null);
    setSaveSuccess(null);

    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      (dob.day || dob.month || dob.year) &&
      !(dob.day && dob.month && dob.year)
    ) {
      setSaveError("Please select a complete date of birth.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    try {
      const dateOfBirth =
        dob.day && dob.month && dob.year
          ? `${dob.year}-${String(MONTHS.indexOf(dob.month) + 1).padStart(2, "0")}-${dob.day.padStart(2, "0")}`
          : null;

      await authFeatureApi.updateProfile({
        name: name.trim(),
        gender: gender || null,
        date_of_birth: dateOfBirth,
      });

      if (avatarFile) {
        const imageResponse =
          await authFeatureApi.updateProfileImage(avatarFile);
        const savedImage = imageResponse.data?.data?.user?.image;
        if (savedImage) setAvatarPreview(savedImage);
        setAvatarFile(null);
      }

      setSaveSuccess("Profile updated successfully.");

      // Hide after exactly 5 seconds
      successTimeoutRef.current = setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);
    } catch (caughtError: unknown) {
      setSaveError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save profile changes. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-6 sm:p-8 flex-1 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="border-b border-slate-100 pb-5 mb-8">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage and protect your account information.
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left: Avatar Photo Card */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 sm:p-7 rounded-lg bg-slate-50/70 border border-slate-200/60">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
            />

            {/* Avatar with Camera Badge */}
            <div className="relative mb-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-200/90 border-2 border-white shadow-xs flex items-center justify-center cursor-pointer overflow-hidden group transition-transform hover:scale-102"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-400 group-hover:text-slate-500 transition-colors" />
                )}
              </div>

              {/* Green Camera Button Badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload photo"
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Outlined "Change Photo" Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-emerald-700 bg-white border border-emerald-600/70 hover:bg-emerald-50/80 shadow-2xs transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Change Photo</span>
            </button>

            {/* Restrictions info */}
            <div className="text-[11px] sm:text-xs text-slate-400 text-center mt-4 space-y-0.5 leading-relaxed">
              <p>File size: maximum 1 MB</p>
              <p>File extension: JPEG, PNG, WEBP</p>
            </div>
          </div>

          {/* Right: Profile Details Form */}
          <form
            id="profile-form"
            onSubmit={handleSubmit}
            className="lg:col-span-8 space-y-6"
          >
            {/* Username (Disabled with Lock) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 sm:items-start">
              <label className="sm:col-span-3 text-xs sm:text-sm font-medium text-slate-700 sm:pt-2.5">
                Username
              </label>
              <div className="sm:col-span-9">
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    disabled
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 text-slate-600 border border-slate-200 rounded-md pr-10 cursor-not-allowed"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Username can only be changed once.
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 sm:items-center">
              <label className="sm:col-span-3 text-xs sm:text-sm font-medium text-slate-700">
                Name
              </label>
              <div className="sm:col-span-9">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2 text-sm bg-white text-slate-900 border border-slate-200 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 sm:items-center">
              <label className="sm:col-span-3 text-xs sm:text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="sm:col-span-9 flex items-center gap-3">
                <span className="text-sm text-slate-800 font-mono">
                  {email}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 sm:items-center">
              <label className="sm:col-span-3 text-xs sm:text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <div className="sm:col-span-9 flex items-center gap-3">
                {phone ? (
                  <>
                    <span className="text-sm text-slate-800 font-mono tracking-wide">
                      {phone}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPhoneModalOpen(true)}
                      className="text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-slate-400">Not added</span>
                    <button
                      type="button"
                      onClick={() => setIsSetPhoneModalOpen(true)}
                      className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                      Add Phone Number
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 sm:items-center">
              <label className="sm:col-span-3 text-xs sm:text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="sm:col-span-9 flex items-center gap-3">
                {hasPassword ? (
                  <>
                    <span className="text-sm text-slate-800 font-mono tracking-widest select-none">
                      ••••••••
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-slate-400">Not set</span>
                    <button
                      type="button"
                      onClick={() => setIsSetPasswordModalOpen(true)}
                      className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                      Set Password
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 sm:items-center">
              <label className="sm:col-span-3 text-xs sm:text-sm font-medium text-slate-700">
                Gender
              </label>
              <div className="sm:col-span-9 flex flex-wrap items-center gap-4 sm:gap-6">
                {(["male", "female", "other"] as const).map((item) => (
                  <label
                    key={item}
                    className="inline-flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={item}
                      checked={gender === item}
                      onChange={() => setGender(item)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700 capitalize">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 sm:items-center">
              <label className="sm:col-span-3 text-xs sm:text-sm font-medium text-slate-700">
                Date of Birth
              </label>
              <div className="sm:col-span-9 grid grid-cols-3 gap-2 sm:gap-3">
                {/* Day */}
                <div className="relative">
                  <select
                    value={dob.day}
                    onChange={(e) =>
                      setDob((d) => ({ ...d, day: e.target.value }))
                    }
                    className="w-full appearance-none px-3 py-2 text-sm bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-emerald-600 pr-8 cursor-pointer"
                  >
                    <option value="" disabled>
                      Day
                    </option>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ),
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Month */}
                <div className="relative">
                  <select
                    value={dob.month}
                    onChange={(e) =>
                      setDob((d) => ({ ...d, month: e.target.value }))
                    }
                    className="w-full appearance-none px-3 py-2 text-sm bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-emerald-600 pr-8 cursor-pointer"
                  >
                    <option value="" disabled>
                      Month
                    </option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Year */}
                <div className="relative">
                  <select
                    value={dob.year}
                    onChange={(e) =>
                      setDob((d) => ({ ...d, year: e.target.value }))
                    }
                    className="w-full appearance-none px-3 py-2 text-sm bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-emerald-600 pr-8 cursor-pointer"
                  >
                    <option value="" disabled>
                      Year
                    </option>
                    {Array.from({ length: 70 }, (_, i) => String(2026 - i)).map(
                      (y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ),
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Action Buttons: Cancel + Save Changes */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 mt-8">
        {/* Status Messages on the left */}
        <div className="w-full sm:w-auto flex items-center">
          {saveError && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-rose-50 border border-rose-200 text-xs sm:text-sm font-medium text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
          {saveSuccess && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-medium text-emerald-700 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}
        </div>

        {/* Buttons on the right */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="profile-form"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 min-w-[130px] px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs hover:shadow transition-all cursor-pointer active:scale-98 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      <ChangeEmailModal
        isOpen={isEmailModalOpen}
        currentEmail={email}
        onClose={() => setIsEmailModalOpen(false)}
        onSuccess={(newEmail) => setEmail(newEmail)}
      />
      <ChangePhoneModal
        isOpen={isPhoneModalOpen}
        currentPhone={phone}
        onClose={() => setIsPhoneModalOpen(false)}
        onSuccess={(newPhone) => setPhone(newPhone)}
      />
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => setHasPassword(true)}
      />
      <SetPhoneModal
        isOpen={isSetPhoneModalOpen}
        onClose={() => setIsSetPhoneModalOpen(false)}
        onSuccess={(newPhone) => setPhone(newPhone)}
      />
      <SetPasswordModal
        isOpen={isSetPasswordModalOpen}
        onClose={() => setIsSetPasswordModalOpen(false)}
        onSuccess={() => setHasPassword(true)}
      />
    </div>
  );
};

export default ProfilePage;
