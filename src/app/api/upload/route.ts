import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAuth([Role.TUTOR, Role.ADMIN]);
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "video/mp4",
      "video/webm",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const resourceType = file.type.startsWith("video/") ? "video" : "raw";

    const result = await new Promise<{ secure_url: string; public_id: string; resource_type: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: resourceType,
              folder: "mathe-matise/materials",
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url: string; public_id: string; resource_type: string });
            }
          )
          .end(buffer);
      }
    );

    return NextResponse.json({
      data: { url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type },
      message: "File uploaded successfully",
    });
  } catch (err) {
    return handleError(err);
  }
}
