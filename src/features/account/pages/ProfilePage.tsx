import { FormEvent, useEffect, useRef, useState, ChangeEvent } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  Camera,
  ChevronDown,
  Loader2,
  Lock,
  Trash2,
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
import {
  PROFILE_IMAGE_ACCEPT,
  PROFILE_IMAGE_HINT,
} from "@/features/auth/constants/profileImage";
import { useProfileImageSelection } from "@/features/auth/hooks/useProfileImageSelection";
import {
  removeProfileImage,
  updateProfileImage,
} from "@/features/auth/store/authThunks";

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
  const dispatch = useAppDispatch();
  const { user, profileImageStatus, profileImageError } = useAppSelector(
    (s) => s.auth,
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hasPassword, setHasPassword] = useState(true);

  const [gender, setGender] = useState<"" | "male" | "female" | "other">("");
  const [dob, setDob] = useState({ day: "", month: "", year: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Profile photo: pending selection with preview is separate
  // from the saved image stored in state.auth.user.
  const photo = useProfileImageSelection();
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSetPhoneModalOpen, setIsSetPhoneModalOpen] = useState(false);
  const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the authenticated user's real name. Never hardcode a real person's name.
  const username = user?.name ?? "User";

  // Saved image comes directly from Redux auth state.
  // Pending preview temporarily overrides it until saved/cancelled.
  const savedPhotoUrl = user?.profile_image ?? null;
  const displayedPhotoUrl = photo.previewUrl ?? savedPhotoUrl;

  const isPhotoBusy = profileImageStatus === "loading";
  const photoError = photo.error ?? profileImageError;

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
    if (user?.phone) setPhone(user.phone);
    if (user?.gender) setGender(user.gender);

    if (user?.date_of_birth) {
      setDob(parseDateOfBirth(user.date_of_birth));
    }

    if (typeof user?.hasPassword === "boolean") {
      setHasPassword(user.hasPassword);
    }
  }, [user]);

  // Clean up timer on unmount.
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handlePhotoSelected = (e: ChangeEvent<HTMLInputElement>) => {
    photo.select(e.target.files?.[0]);
    setPhotoSuccess(null);
    e.target.value = "";
  };

  const handlePhotoUpload = async () => {
    if (!photo.file) return;

    try {
      await dispatch(updateProfileImage({ image: photo.file })).unwrap();

      // Redux auth.user now contains the new profile image URL.
      photo.clear();
      setPhotoSuccess("Profile photo updated.");
    } catch {
      // Error is rendered from state.auth.profileImageError.
    }
  };

  const handlePhotoCancel = () => {
    photo.clear();
    setPhotoSuccess(null);
  };

  const handlePhotoRemove = async () => {
    photo.clear();
    setPhotoSuccess(null);

    try {
      await dispatch(removeProfileImage()).unwrap();
      setPhotoSuccess("Profile photo removed.");
    } catch {
      // Error is rendered from state.auth.profileImageError.
    }
  };

  const handleReset = () => {
    setName(user?.name ?? "");
    setGender(user?.gender ?? "");

    if (user?.date_of_birth) {
      setDob(parseDateOfBirth(user.date_of_birth));
    } else {
      setDob({ day: "", month: "", year: "" });
    }

    photo.clear();
    setPhotoSuccess(null);
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

      setSaveSuccess("Profile updated successfully.");

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
              onChange={handlePhotoSelected}
              accept={PROFILE_IMAGE_ACCEPT}
              className="hidden"
            />

            {/* Avatar with Camera Badge */}
            <div className="relative mb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPhotoBusy}
                aria-label="Change profile photo"
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-200/90 border-2 border-white shadow-md flex items-center justify-center cursor-pointer overflow-hidden group transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {displayedPhotoUrl ? (
                  <img
                    src={displayedPhotoUrl}
                    alt={user?.name ?? "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-400 group-hover:text-slate-500 transition-colors" />
                )}

                {/* Subtle hover overlay */}
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>

              {/* Camera action */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPhotoBusy}
                aria-label="Change profile photo"
                className="absolute bottom-0.5 right-0.5 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md ring-2 ring-white transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Upload/remove loading state */}
              {isPhotoBusy && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 pointer-events-none">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </span>
              )}
            </div>

            {/* Pending photo actions */}
            {photo.file && (
              <div className="flex items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={handlePhotoUpload}
                  disabled={isPhotoBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPhotoBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}

                  <span>{isPhotoBusy ? "Saving..." : "Save photo"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePhotoCancel}
                  disabled={isPhotoBusy}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Remove photo - intentionally subtle */}
            {!photo.file && savedPhotoUrl && (
              <button
                type="button"
                onClick={handlePhotoRemove}
                disabled={isPhotoBusy}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-rose-500 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove photo</span>
              </button>
            )}

            {/* Photo feedback */}
            {photoError && (
              <p
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-rose-600"
                role="alert"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{photoError}</span>
              </p>
            )}

            {photoSuccess && !photoError && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{photoSuccess}</span>
              </p>
            )}

            {/* Restrictions info */}
            <div className="text-[11px] sm:text-xs text-slate-400 text-center mt-4 space-y-0.5 leading-relaxed">
              <p>{PROFILE_IMAGE_HINT}</p>
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
                    <span className="text-sm text-slate-400">
                      Not added
                    </span>

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