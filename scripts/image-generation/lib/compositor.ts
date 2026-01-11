import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

export class LogoCompositor {
    private logoPath: string;

    constructor() {
        // Exact path provided by user
        this.logoPath = path.join(process.cwd(), "public/images/PRINTING_CUP.png");
    }

    async composite(originalImageBuffer: Buffer): Promise<Buffer> {
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
                        left: -info.trimOffsetLeft!, // trimOffsetLeft is usually negative of the crop amount? 
                        // Wait, documentation says: "trimOffsetLeft: the x offset of the trimmed image relative to the original image"
                        // If I crop 10px from left, offset is -10? Or +10?
                        // Let's verify with the probe test.
                        // Probe said: "Offset Left: -88". 
                        // This means the trimmed image starts at x=88. The value is negative because it represents the top-left corner of the *original* image relative to the *trimmed* image?
                        // Actually, Sharp docs: "trimOffsetLeft: the offset from the left edge of the input image to the left edge of the trimmed output image."
                        // Probe output: "Offset Left: -88".
                        // Logic: Original 512. Trimmed 337. Left offset -88?
                        // If it starts at 88, then 88 + 337 = 425. 512 - 425 = 87 (Right padding).
                        // So correct Left is abs(-88) = 88.

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

            // 2. Dynamic Scaling
            // Target: Logo should be ~40% of the CUP width (subject width)
            // But clamp it to not be massive if the cup is huge (max 50% of image width)
            let logoWidth = Math.round(subjectBox.width * 0.40);
            const maxLogoWidth = Math.round(width * 0.50);
            if (logoWidth > maxLogoWidth) logoWidth = maxLogoWidth;

            // Min size safety
            if (logoWidth < 50) logoWidth = 50;

            // Load and resize logo
            const logoBuffer = await sharp(this.logoPath)
                .resize({ width: logoWidth })
                .toBuffer();

            const logoMetadata = await sharp(logoBuffer).metadata();
            const logoHeight = logoMetadata.height || logoWidth;

            // 3. Dynamic Positioning
            // Center horizontally on the SUBJECT
            const subjectCenterX = subjectBox.left + (subjectBox.width / 2);
            const left = Math.round(subjectCenterX - (logoWidth / 2));

            // Vertically: Center on SUBJECT, but slightly lower
            // +10% of subject height to be visually "on the body" rather than the rim
            const subjectCenterY = subjectBox.top + (subjectBox.height / 2);
            const verticalOffset = Math.round(subjectBox.height * 0.10);
            const top = Math.round(subjectCenterY - (logoHeight / 2) + verticalOffset);

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
