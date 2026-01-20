import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { LogoAdjustment } from "./validator";

export class LogoCompositor {
    private logoPath: string;

    constructor() {
        // Exact path provided by user
        this.logoPath = path.join(process.cwd(), "public/images/PRINTING_CUP.png");
    }

    async composite(
        originalImageBuffer: Buffer, 
        adjustment?: LogoAdjustment
    ): Promise<Buffer> {
        try {
            // Check if logo exists
            await fs.access(this.logoPath);

            const image = sharp(originalImageBuffer);
            const metadata = await image.metadata();
            const width = metadata.width || 1024;
            const height = metadata.height || 1024;

            // 1. Detect Subject via Trim
            // We use trim() to find the bounding box of the non-transparent/non-background pixels.
            // Since our images have transparent backgrounds (or uniform), this works well.
            let subjectBox = { left: 0, top: 0, width: width, height: height };

            try {
                const { info } = await image.trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
                // Calculate absolute coordinates
                // trimOffsetLeft/Top are offsets relative to the original image top-left
                // But wait, sharp.trim returns a cropped image. info contains dimensions of the crop.
                // trimOffsetLeft is negative if it's a crop? No, usually it's the offset.
                // Actually in 'sharp', trim() *removes* pixels. 
                // To get coordinates WITHOUT cropping, we rely on the info object properties:
                // trimOffsetLeft: integer - the x offset of the trimmed image relative to the original image
                // trimOffsetTop: integer - the y offset of the trimmed image relative to the original image

                // If trim returns the same size, it means no trim happened.
                if (info.width !== width || info.height !== height) {
                    subjectBox = {
                        // Revised Logic:
                        left: Math.abs(info.trimOffsetLeft || 0),
                        top: Math.abs(info.trimOffsetTop || 0),
                        width: info.width,
                        height: info.height
                    };
                    // specific check for 0 detection
                    if (subjectBox.width < 50 || subjectBox.height < 50) {
                        // Fallback to full size if detected object is tiny noise
                        subjectBox = { left: 0, top: 0, width: width, height: height };
                    }
                }
            } catch (ignore) {
                // If trim fails, default to full size
            }

            console.log(`   🎯 Detected Subject: ${subjectBox.width}x${subjectBox.height} at (${subjectBox.left}, ${subjectBox.top})`);

            // If trim-based detection failed (common when background isn't transparent),
            // fall back to a conservative "cup body safe zone" in the center.
            // This is where the logo should live for our centered product shots.
            const detectionLooksLikeFullFrame =
                subjectBox.left === 0 &&
                subjectBox.top === 0 &&
                subjectBox.width >= Math.round(width * 0.95) &&
                subjectBox.height >= Math.round(height * 0.95);

            if (detectionLooksLikeFullFrame) {
                subjectBox = {
                    left: Math.round(width * 0.22),
                    top: Math.round(height * 0.20),
                    width: Math.round(width * 0.56),
                    height: Math.round(height * 0.70),
                };
                console.log(
                    `   🎯 Subject detection fallback: using cup body safe zone ${subjectBox.width}x${subjectBox.height} at (${subjectBox.left}, ${subjectBox.top})`,
                );
            }

            // 2. Dynamic Scaling
            // Target: Logo should be ~28-33% of the CUP width (subject width) (smaller than before)
            // Clamp to avoid over-sizing.
            let logoWidth = Math.round(subjectBox.width * 0.30);
            const maxLogoWidth = Math.round(width * 0.38);
            if (logoWidth > maxLogoWidth) logoWidth = maxLogoWidth;

            // Min size safety
            if (logoWidth < 50) logoWidth = 50;

            // Apply size adjustment if provided
            if (adjustment?.sizeMultiplier) {
                logoWidth = Math.round(logoWidth * adjustment.sizeMultiplier);
                // Re-clamp after adjustment
                if (logoWidth > maxLogoWidth) logoWidth = maxLogoWidth;
                if (logoWidth < 50) logoWidth = 50;
            }

            // Load and resize logo
            let logoBuffer = await sharp(this.logoPath)
                .resize({ width: logoWidth })
                .toBuffer();

            // Slight affine warp to mimic cup curvature (subtle, safe default).
            // This is NOT full perspective, but helps avoid a "flat sticker" feel.
            // Can be tuned later with AI-provided geometry if we add it.
            try {
                logoBuffer = await sharp(logoBuffer)
                    .affine(
                        [
                            [1, 0.08], // x' = x + 0.08*y  (subtle x-shear)
                            [0, 1],
                        ],
                        { background: { r: 0, g: 0, b: 0, alpha: 0 } },
                    )
                    .toBuffer();
            } catch {
                // If affine fails, keep original logo buffer.
            }

            const logoMetadata = await sharp(logoBuffer).metadata();
            const logoHeight = logoMetadata.height || logoWidth;

            // 3. Dynamic Positioning
            // Center horizontally on the SUBJECT
            const subjectCenterX = subjectBox.left + (subjectBox.width / 2);
            let left = Math.round(subjectCenterX - (logoWidth / 2));

            // Vertically: place logo on the cup "body" area (avoid rim + base).
            // ~60% down within the subject box tends to land on the cup sleeve area.
            const logoCenterY = subjectBox.top + Math.round(subjectBox.height * 0.60);
            let top = Math.round(logoCenterY - (logoHeight / 2));

            // Apply position adjustments if provided
            if (adjustment?.horizontalOffset) {
                left = Math.round(left + adjustment.horizontalOffset);
                // Ensure logo doesn't go off-screen
                left = Math.max(0, Math.min(left, width - logoWidth));
            }

            if (adjustment?.verticalOffset) {
                top = Math.round(top + adjustment.verticalOffset);
                // Ensure logo doesn't go off-screen
                top = Math.max(0, Math.min(top, height - logoHeight));
            }

            if (adjustment) {
                console.log(`   🔧 Applied adjustments: size=${adjustment.sizeMultiplier || 1.0}x, hOffset=${adjustment.horizontalOffset || 0}, vOffset=${adjustment.verticalOffset || 0}`);
            }

            return await sharp(originalImageBuffer)
                .composite([
                    {
                        input: logoBuffer,
                        top: top,
                        left: left,
                        blend: "over" // 'overlay' or 'multiply' might look better on white, but 'over' is safest for PNG
                    }
                ])
                .toBuffer();

        } catch (error) {
            console.warn("⚠️ Logo composition failed (skipping overlay):", error);
            return originalImageBuffer;
        }
    }
}
