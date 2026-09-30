import { useCallback, useEffect, useRef, useState } from "react";
import { validateProfileImageFile } from "../constants/profileImage";

/**
 * Local selection state for a profile image.
 *
 * Keeps a preview object URL alive, revokes it when the selection changes or the
 * component unmounts (object URLs leak otherwise) and validates the file before
 * it ever reaches the API client.
 */
export const useProfileImageSelection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  const releasePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    releasePreview();
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  }, [releasePreview]);

  /** Returns true when the file was accepted. */
  const select = useCallback(
    (candidate: File | null | undefined): boolean => {
      if (!candidate) return false;

      const validationError = validateProfileImageFile(candidate);

      if (validationError) {
        setError(validationError);
        return false;
      }

      releasePreview();

      const objectUrl = URL.createObjectURL(candidate);
      previewRef.current = objectUrl;

      setFile(candidate);
      setPreviewUrl(objectUrl);
      setError(null);

      return true;
    },
    [releasePreview],
  );

  // Release the last preview when the component goes away.
  useEffect(() => releasePreview, [releasePreview]);

  return { file, previewUrl, error, select, clear, setError };
};
