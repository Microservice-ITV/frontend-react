/**
 * Client side rules for profile images.
 *
 * Single source of truth for the auth feature and mirrors the backend limits
 * (config/profile_image.php) so the user is told about a problem before the
 * upload happens. The backend validates the real image content again.
 */
export const PROFILE_IMAGE_FIELD = "profile_image";

export const PROFILE_IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const PROFILE_IMAGE_HINT = "JPEG, PNG or WebP - up to 5 MB.";

export const validateProfileImageFile = (file: File): string | null => {
  if (!PROFILE_IMAGE_ALLOWED_TYPES.includes(file.type)) {
    return "Please choose a JPEG, PNG or WebP image.";
  }

  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return "The image must not be larger than 5 MB.";
  }

  return null;
};
