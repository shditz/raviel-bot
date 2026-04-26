require("dotenv").config();
const path = require("path");
const fs = require("fs").promises;

let imageCache = {
  botImage: null,
  ownerImage: null,
  pingImage: null,
  speedImage: null,
  runtimeImage: null,
  statusImage: null,
  errorImage: null,
};

let isLoadingImages = false;
let imagesLoaded = false;

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
      fs.readFile(path.join(__dirname, "assets", "image", "error.jfif")),
    ]);

    imageCache = {
      botImage: bot,
      ownerImage: owner,
      pingImage: ping,
      speedImage: speed,
      runtimeImage: runtime,
      statusImage: status,
      errorImage: error,
    };

    imagesLoaded = true;
    console.log("✅ Bot images preloaded successfully (non-blocking)");
  } catch (err) {
    console.error("❌ Failed to preload images:", err.message);
    isLoadingImages = false;
  }
}

function getImage(imageName) {
  const image = imageCache[imageName];
  if (image) {
    return image;
  }

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
      errorImage: path.join(imagePath, "error.jfif"),
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
  get errorImage() {
    return getImage("errorImage");
  },
  preloadImages,
  isImagesLoaded: () => imagesLoaded,
};
