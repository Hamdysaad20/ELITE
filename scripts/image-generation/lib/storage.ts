import fs from "fs/promises";
import path from "path";

export class FluxStorage {
    private dataDir = path.join(process.cwd(), "data");
    private filePath = path.join(this.dataDir, "flux-dataset.json");

    async save(data: any): Promise<void> {
        // Ensure data directory exists
        await fs.mkdir(this.dataDir, { recursive: true });

        // Create backup if exists
        try {
            await fs.access(this.filePath);
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const backupPath = path.join(this.dataDir, `flux-dataset-backup-${timestamp}.json`);
            await fs.copyFile(this.filePath, backupPath);
            console.log(`Backup created at ${backupPath}`);
        } catch {
            // File doesn't exist, no backup needed
        }

        // Write new data
        await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
        console.log(`Dataset saved to ${this.filePath}`);
    }

    async load(): Promise<any | null> {
        try {
            const data = await fs.readFile(this.filePath, "utf-8");
            return JSON.parse(data);
        } catch {
            return null;
        }
    }
}
