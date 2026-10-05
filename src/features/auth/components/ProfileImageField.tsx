import { ChangeEvent, useRef } from "react";
import { Camera, Trash2, User } from "lucide-react";
import { PROFILE_IMAGE_ACCEPT, PROFILE_IMAGE_HINT } from "../constants/profileImage";

type ProfileImageFieldProps = {
  previewUrl: string | null;
  error?: string | null;
  disabled?: boolean;
  onSelect: (file: File | undefined) => void;
  onClear: () => void;
};

/**
 * Optional profile photo picker for the registration form.
 *
 * Purely presentational: the selection/validation state lives in
 * useProfileImageSelection and submitting the form without a photo stays valid.
 */
const ProfileImageField = ({
  previewUrl,
  error,
  disabled,
  onSelect,
  onClear,
}: ProfileImageFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSelect(event.target.files?.[0]);
    // Reset so the same file can be picked again after being removed.
    event.target.value = "";
  };

  return (
    <div className="flex items-start gap-4">
      <div className="relative shrink-0">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile photo preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-7 w-7 text-gray-400" aria-hidden />
          )}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          aria-label="Choose profile photo"
          className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">
          Profile photo{" "}
          <span className="text-xs font-normal text-gray-400">(optional)</span>
        </p>

        <div className="mt-1 flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="cursor-pointer font-medium text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {previewUrl ? "Change photo" : "Upload photo"}
          </button>

          {previewUrl && (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="inline-flex cursor-pointer items-center gap-1 font-medium text-gray-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          )}
        </div>

        <p className="mt-1 text-[11px] text-gray-400">{PROFILE_IMAGE_HINT}</p>

        {error && (
          <p className="mt-1 text-[11px] text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PROFILE_IMAGE_ACCEPT}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default ProfileImageField;
