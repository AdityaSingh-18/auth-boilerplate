import JSZip from "jszip";
import { NextResponse } from "next/server";
import { loadTemplateFiles } from "@/lib/templates";

interface RouteContext {
  params: Promise<{
    methodId: string;
    variantId: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { methodId, variantId } = await params;

    const files = await loadTemplateFiles(methodId, variantId);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "This template does not contain any files." },
        { status: 404 },
      );
    }

    const zip = new JSZip();

    for (const file of files) {
      zip.file(`${variantId}/${file.path}`, file.content);
    }

    const archive = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    });

    return new Response(new Uint8Array(archive), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="auth-${methodId}.zip"`,
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
