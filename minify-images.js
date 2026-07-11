const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, 'catalogue');

async function getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

async function minifyImages() {
  console.log('Finding images in', IMG_DIR);
  let files;
  try {
    files = await getFiles(IMG_DIR);
  } catch(e) {
    console.error('Could not read img directory', e);
    return;
  }
  
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  console.log(`Found ${imageFiles.length} images to compress.`);
  
  let successCount = 0;
  let errorCount = 0;
  
  let totalOriginalSize = 0;
  let totalNewSize = 0;

  for (const file of imageFiles) {
    try {
      const stat = fs.statSync(file);
      const originalSize = stat.size;
      totalOriginalSize += originalSize;

      const ext = path.extname(file).toLowerCase();
      const tempFile = file + '.tmp';
      
      let sharpInstance = sharp(file).resize({ width: 1200, withoutEnlargement: true }); // max width 1200
      
      if (ext === '.png') {
        sharpInstance = sharpInstance.png({ compressionLevel: 8, quality: 80, adaptiveFiltering: true });
      } else {
        sharpInstance = sharpInstance.jpeg({ quality: 80, progressive: true, mozjpeg: true });
      }

      await sharpInstance.toFile(tempFile);
      
      const newStat = fs.statSync(tempFile);
      const newSize = newStat.size;
      
      // Only replace if it's actually smaller
      if (newSize < originalSize) {
        fs.renameSync(tempFile, file);
        totalNewSize += newSize;
        successCount++;
        // console.log(`Compressed ${path.basename(file)}: ${(originalSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB`);
      } else {
        fs.unlinkSync(tempFile);
        totalNewSize += originalSize;
      }
      
    } catch (e) {
      console.error(`Error processing ${file}:`, e.message);
      errorCount++;
    }
  }

  console.log(`\nFinished! Successfully compressed ${successCount} images. Errors: ${errorCount}`);
  console.log(`Total size before: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total size after:  ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved: ${((totalOriginalSize - totalNewSize) / 1024 / 1024).toFixed(2)} MB (${Math.round((totalOriginalSize - totalNewSize) / totalOriginalSize * 100)}%)`);
}

minifyImages();
