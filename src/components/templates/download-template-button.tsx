interface DownloadTemplateButtonProps {
  methodId: string;
  variantId: string;
  className?: string;
}

export function DownloadTemplateButton({
  methodId,
  variantId,
  className,
}: DownloadTemplateButtonProps) {
  const downloadUrl = `/api/templates/${encodeURIComponent(
    methodId,
  )}/${encodeURIComponent(variantId)}/download`;

  return (
    <a
      href={downloadUrl}
      download
      className={
        className ??
        "inline-flex items-center justify-center rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
      }
    >
      Download ZIP
    </a>
  );
}
