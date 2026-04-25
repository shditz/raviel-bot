/**
 * Temporary File Cleanup Utility
 * Automatically cleans up old temporary files to prevent disk bloat
 */

const fs = require("fs");
const path = require("path");

class TempFileCleanup {
  constructor(tmpDir = null, maxAgeMs = 3600000) {
    this.tmpDir = tmpDir || path.join(__dirname, "..", "tmp");
    this.maxAgeMs = maxAgeMs; // Default: 1 hour
    this.checkInterval = null;
  }

  /**
   * Start automatic cleanup (runs periodically)
   */
  start(intervalMs = 600000) {
    // Default: cleanup every 10 minutes
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.cleanup().catch((err) => {
        console.error("Cleanup error:", err.message);
      });
    }, intervalMs);

    console.log(`✅ Temp cleanup started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop automatic cleanup
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("✅ Temp cleanup stopped");
    }
  }

  /**
   * Run cleanup once
   */
  async cleanup() {
    try {
      if (!fs.existsSync(this.tmpDir)) {
        return {deleted: 0, errors: 0};
      }

      const files = fs.readdirSync(this.tmpDir);
      let deleted = 0;
      let errors = 0;
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.tmpDir, file);
        try {
          const stats = fs.statSync(filePath);
          const age = now - stats.mtimeMs;

          // Delete if older than maxAge
          if (age > this.maxAgeMs) {
            fs.unlinkSync(filePath);
            deleted++;
          }
        } catch (err) {
          errors++;
          console.warn(`Failed to clean file ${file}:`, err.message);
        }
      }

      if (deleted > 0) {
        console.log(`🗑️ Cleaned ${deleted} temp files (${errors} errors)`);
      }

      return {deleted, errors};
    } catch (err) {
      console.error("Cleanup failed:", err.message);
      return {deleted: 0, errors: 1};
    }
  }

  /**
   * Force delete all temp files
   */
  async clearAll() {
    try {
      if (!fs.existsSync(this.tmpDir)) {
        return {deleted: 0};
      }

      const files = fs.readdirSync(this.tmpDir);
      let deleted = 0;

      for (const file of files) {
        const filePath = path.join(this.tmpDir, file);
        try {
          fs.unlinkSync(filePath);
          deleted++;
        } catch (err) {
          console.warn(`Failed to delete ${file}:`, err.message);
        }
      }

      console.log(`✅ Cleared ${deleted} temp files`);
      return {deleted};
    } catch (err) {
      console.error("Clear all failed:", err.message);
      return {deleted: 0};
    }
  }

  /**
   * Get temp directory size (in MB)
   */
  getSize() {
    try {
      if (!fs.existsSync(this.tmpDir)) {
        return 0;
      }

      const files = fs.readdirSync(this.tmpDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.tmpDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }

      return (totalSize / 1024 / 1024).toFixed(2); // Return in MB
    } catch (err) {
      console.error("Failed to get size:", err.message);
      return 0;
    }
  }
}

module.exports = {TempFileCleanup};
