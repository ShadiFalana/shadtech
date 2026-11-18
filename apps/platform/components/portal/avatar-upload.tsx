"use client";

import { removeAvatar } from "@/actions/profile";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing-client";
import { translateKey } from "@/lib/dictionaries";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function AvatarUpload({ hasImage }: { hasImage: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [removing, setRemoving] = useState(false);
  const { startUpload, isUploading } = useUploadThing("avatar", {
    onClientUploadComplete: () => {
      toast.success(t.portal.avatarUploaded);
      router.refresh();
    },
    onUploadError: () => {
      toast.error(t.portal.avatarUploadFailed);
    },
  });

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    await startUpload(files);
  }

  async function onRemove() {
    setRemoving(true);
    const result = await removeAvatar();
    setRemoving(false);
    if (!result.ok) {
      toast.error(translateKey(t, result.errorKey) ?? t.common.error);
      return;
    }
    toast.success(translateKey(t, result.messageKey) ?? t.common.success);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      <Button type="button" size="sm" disabled={isUploading} onClick={() => inputRef.current?.click()}>
        {isUploading ? t.portal.uploading : t.portal.uploadAvatar}
      </Button>
      {hasImage ? (
        <Button type="button" size="sm" variant="outline" disabled={removing} onClick={onRemove}>
          {removing ? t.common.loading : t.portal.removeAvatar}
        </Button>
      ) : null}
    </div>
  );
}
