// Image processing script for exercise photos
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ideal specifications for exercise images
const TARGET_SPECS = {
    width: 400,
    height: 300,
    quality: 85,
    format: 'jpg'
};

// Current exercise images to process
const EXERCISE_IMAGES = [
    'ankle_circles.jpg',
    'arm_circles.jpg', 
    'bar_hang.jpg',
    'calf_stretch.jpg',
    'chest_stretch.jpg',
    'chin_assist.jpg',
    'db_curl.jpg',
    'db_press.jpg',
    'db_rdl.jpg',
    'db_row.jpg',
    'db_shoulder.jpg',
    'face_pulls.jpg',
    'glute_bridge.jpg',
    'plank.jpg',
    'pushup.jpg',
    'shoulder_stretch.jpg',
    'step_up.jpg',
    'trx_squat.jpg',
    'wall_slides.jpg'
];

// Function to process and resize images
async function resizeImages() {
    const inputDir = './src/assets/exercises';
    const backupDir = './src/assets/exercises/originals';
    
    // Create backup directory
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    console.log('🔄 Processing images...\n');
    
    let processed = 0;
    let errors = 0;
    
    for (const imageName of EXERCISE_IMAGES) {
        const inputPath = path.join(inputDir, imageName);
        const backupPath = path.join(backupDir, imageName);
        const outputPath = path.join(inputDir, imageName); // Overwrite original
        
        try {
            // Check if file exists
            if (!fs.existsSync(inputPath)) {
                console.log(`⚠️  File not found: ${imageName}`);
                continue;
            }
            
            // Backup original
            fs.copyFileSync(inputPath, backupPath);
            
            // Get original dimensions for comparison
            const metadata = await sharp(inputPath).metadata();
            
            // Resize and optimize
            await sharp(inputPath)
                .resize(TARGET_SPECS.width, TARGET_SPECS.height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ 
                    quality: TARGET_SPECS.quality,
                    progressive: true,
                    mozjpeg: true 
                })
                .toFile(outputPath + '.tmp');
            
            // Replace original with processed version
            fs.renameSync(outputPath + '.tmp', outputPath);
            
            // Get new file size
            const oldSize = fs.statSync(backupPath).size;
            const newSize = fs.statSync(outputPath).size;
            const savings = ((oldSize - newSize) / oldSize * 100).toFixed(1);
            
            console.log(`✅ ${imageName}`);
            console.log(`   ${metadata.width}x${metadata.height} → ${TARGET_SPECS.width}x${TARGET_SPECS.height}`);
            console.log(`   ${(oldSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB (${savings}% smaller)`);
            console.log('');
            
            processed++;
            
        } catch (error) {
            console.error(`❌ Error processing ${imageName}:`, error.message);
            errors++;
        }
    }
    
    console.log(`\n� Processing complete:`);
    console.log(`   ✅ Successfully processed: ${processed} images`);
    console.log(`   ❌ Errors: ${errors} images`);
    console.log(`   📁 Originals backed up to: ${backupDir}`);
    console.log(`\n🎯 All images now: ${TARGET_SPECS.width}x${TARGET_SPECS.height}px @ ${TARGET_SPECS.quality}% quality`);
}

// Animation format support info
console.log('🎬 Animation Format Support:');
console.log('   📹 WebP: Best quality, smaller file size, wide support');
console.log('   🎞️  GIF: Universal support, larger files');
console.log('   📸 JPG: Static fallback, smallest files');
console.log('');
console.log('📐 Current Processing: Resize JPG images to optimal size');
console.log(`   Target: ${TARGET_SPECS.width}x${TARGET_SPECS.height}px`);
console.log(`   Quality: ${TARGET_SPECS.quality}%`);
console.log(`   Format: ${TARGET_SPECS.format.toUpperCase()}`);
console.log('');

// Run the resize process
resizeImages().catch(console.error);