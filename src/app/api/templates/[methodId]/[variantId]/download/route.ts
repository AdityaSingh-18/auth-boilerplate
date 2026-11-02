import JSZip from "jszip";
import { NextResponse } from "next/server";
import { loadTemplateFiles } from "@/lib/templates";

interface RouteContext {
  params: Promise<{
    methodId: string;
    variantId: string;
  }>;
}

type DownloadPackage = "full" | "core";

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { methodId, variantId } = await params;

    const url = new URL(request.url);

    const packageParam = url.searchParams.get("package") ?? "full";
    if (packageParam !== "full" && packageParam !== "core") {
      return NextResponse.json(
        { error: "Invalid package type. Choose 'full' or 'core'." },
        { status: 400 },
      );
    }

    const packageType: DownloadPackage = packageParam;
    if (packageType !== "full" && packageType !== "core") {
      return NextResponse.json(
        { error: "Invalid package type. Choose 'full' or 'core'." },
        { status: 400 },
      );
    }

    const files = await loadTemplateFiles(methodId, variantId);
    const includedFiles = files.filter((file) => {
      if (file.path === "README.md")   return true;
      if (file.path.startsWith("core/"))   return true;

      if (
        packageType === "full" &&
        file.path.startsWith("optional-ui/")
      ) {
        return true;
      }

      return false;
    });

    if (includedFiles.length === 0) {
      return NextResponse.json(
        { error: "This template does not contain any files for the selected package." },
        { status: 404 },
      );
    }

    const zip = new JSZip();
    for (const file of includedFiles) {
      zip.file(`${variantId}/${file.path}`, file.content);
    }

    const archive = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    });

    const filename = packageType === "core"
      ? `auth-${methodId}-core.zip`
      : `auth-${methodId}.zip`;

    return new Response(new Uint8Array(archive), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create ZIP archive.";

    const isNotFound = message.startsWith("Template not found");

    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 400 },
    );
  }
}
