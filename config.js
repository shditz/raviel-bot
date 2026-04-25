require("dotenv").config();
const path = require("path");
const fs = require("fs").promises;

// ⚠️ IMPORTANT: Images are now loaded asynchronously to prevent startup blocking
// They will be cached after first load

let imageCache = {
  botImage: null,
  ownerImage: null,
  pingImage: null,
  speedImage: null,
  runtimeImage: null,
  statusImage: null,
};

let isLoadingImages = false;
let imagesLoaded = false;

/**
 * Async function to preload all images into cache
 * Called during bot startup to avoid blocking
 */
async function preloadImages() {
  if (imagesLoaded || isLoadingImages) return;

  isLoadingImages = true;
  try {
    const [bot, owner, ping, speed, runtime, status] = await Promise.all([
      fs.readFile(path.join(__dirname, "assets", "image", "menu.jpg")),
      fs.readFile(path.join(__dirname, "assets", "image", "owner.jfif")),
      fs.readFile(path.join(__dirname, "assets", "image", "ping.jfif")),
      fs.readFile(path.join(__dirname, "assets", "image", "speed.webp")),
      fs.readFile(path.join(__dirname, "assets", "image", "runtime.webp")),
      fs.readFile(path.join(__dirname, "assets", "image", "status.jfif")),
    ]);

    imageCache = {
      botImage: bot,
      ownerImage: owner,
      pingImage: ping,
      speedImage: speed,
      runtimeImage: runtime,
      statusImage: status,
    };

    imagesLoaded = true;
    console.log("✅ Bot images preloaded successfully (non-blocking)");
  } catch (err) {
    console.error("❌ Failed to preload images:", err.message);
    isLoadingImages = false;
  }
}

/**
 * Get cached image (with fallback to sync load if not preloaded)
 * This is a safety measure - normally images should be preloaded
 */
function getImage(imageName) {
  const image = imageCache[imageName];
  if (image) {
    return image;
  }

  // Fallback: sync load (should not happen if preload worked)
  console.warn(`⚠️ Image ${imageName} not preloaded, loading synchronously`);
  try {
    const imagePath = path.join(__dirname, "assets", "image");
    const fileMap = {
      botImage: path.join(imagePath, "menu.jpg"),
      ownerImage: path.join(imagePath, "owner.jfif"),
      pingImage: path.join(imagePath, "ping.jfif"),
      speedImage: path.join(imagePath, "speed.webp"),
      runtimeImage: path.join(imagePath, "runtime.webp"),
      statusImage: path.join(imagePath, "status.jfif"),
    };
    return require("fs").readFileSync(fileMap[imageName]);
  } catch (err) {
    console.error(`Failed to load image ${imageName}:`, err.message);
    return Buffer.alloc(0);
  }
}

module.exports = {
  botName: process.env.BOT_NAME || "RAVIEL BOT",
  ownerName: process.env.OWNER_NAME || "ShDitz",
  ownerNumber: "6282268744897",
  prefix: "!",
  get botImage() {
    return getImage("botImage");
  },
  get ownerImage() {
    return getImage("ownerImage");
  },
  get pingImage() {
    return getImage("pingImage");
  },
  get speedImage() {
    return getImage("speedImage");
  },
  get runtimeImage() {
    return getImage("runtimeImage");
  },
  get statusImage() {
    return getImage("statusImage");
  },
  preloadImages,
  isImagesLoaded: () => imagesLoaded,
};
