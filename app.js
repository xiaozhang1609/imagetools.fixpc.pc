// Global variables
let splitImage, joinImages = [], joinType = 'grid';
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const previewContainer = document.getElementById('previewContainer');
const previewTitle = document.getElementById('previewTitle');

// Image splitting functionality
document.getElementById('splitUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            splitImage = img;
            updateSplitPreview();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

document.getElementById('rows').addEventListener('change', updateSplitPreview);
document.getElementById('cols').addEventListener('change', updateSplitPreview);

function updateSplitPreview() {
    if (!splitImage) return;

    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    previewContainer.innerHTML = '<div id="previewTitle">分割预览</div>';

    const width = splitImage.width / cols;
    const height = splitImage.height / rows;

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gap = '2px';

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(splitImage, j * width, i * height, width, height, 0, 0, width, height);
            const img = document.createElement('img');
            img.src = canvas.toDataURL();
            img.style.width = '100%';
            img.style.height = 'auto';
            img.className = 'rounded shadow-sm';
            grid.appendChild(img);
        }
    }

    previewContainer.appendChild(grid);
}

document.getElementById('downloadSplit').addEventListener('click', async () => {
    if (!splitImage) {
        alert('请先上传图片');
        return;
    }

    const zip = new JSZip();
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    const width = splitImage.width / cols;
    const height = splitImage.height / rows;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(splitImage, j * width, i * height, width, height, 0, 0, width, height);
            const data = canvas.toDataURL().split(',')[1];
            zip.file(`part_${i + 1}_${j + 1}.png`, data, { base64: true });
        }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'split_images.zip';
    link.click();
});

// Image joining functionality
document.getElementById('joinUpload').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    Promise.all(files.map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    })).then(images => {
        joinImages = images;
        preprocessJoinImages();
    });
});

function preprocessJoinImages() {
    if (joinImages.length === 0) return;

    let maxWidth = 0;
    let maxHeight = 0;

    joinImages.forEach(img => {
        maxWidth = Math.max(maxWidth, img.width);
        maxHeight = Math.max(maxHeight, img.height);
    });

    joinImages = joinImages.map(img => {
        const aspectRatio = img.width / img.height;
        let newWidth, newHeight;

        if (aspectRatio > maxWidth / maxHeight) {
            newWidth = maxWidth;
            newHeight = newWidth / aspectRatio;
        } else {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
        }

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = maxWidth;
        tempCanvas.height = maxHeight;

        const x = (maxWidth - newWidth) / 2;
        const y = (maxHeight - newHeight) / 2;

        tempCtx.drawImage(img, x, y, newWidth, newHeight);

        const newImg = new Image();
        newImg.src = tempCanvas.toDataURL();
        return newImg;
    });

    updateJoinPreview();
}

document.getElementById('gridJoin').addEventListener('click', () => {
    joinType = 'grid';
    updateJoinPreview();
});

document.getElementById('horizontalJoin').addEventListener('click', () => {
    joinType = 'horizontal';
    updateJoinPreview();
});

document.getElementById('verticalJoin').addEventListener('click', () => {
    joinType = 'vertical';
    updateJoinPreview();
});

function updateJoinPreview() {
    if (joinImages.length === 0) return;

    previewContainer.innerHTML = '<div id="previewTitle">拼接预览</div>';

    const maxWidth = joinImages[0].width;
    const maxHeight = joinImages[0].height;

    if (joinType === 'vertical') {
        canvas.width = maxWidth;
        canvas.height = maxHeight * joinImages.length;
        joinImages.forEach((img, index) => {
            ctx.drawImage(img, 0, index * maxHeight);
        });
    } else if (joinType === 'horizontal') {
        canvas.width = maxWidth * joinImages.length;
        canvas.height = maxHeight;
        joinImages.forEach((img, index) => {
            ctx.drawImage(img, index * maxWidth, 0);
        });
    } else if (joinType === 'grid') {
        const cols = Math.ceil(Math.sqrt(joinImages.length));
        const rows = Math.ceil(joinImages.length / cols);
        canvas.width = maxWidth * cols;
        canvas.height = maxHeight * rows;
        joinImages.forEach((img, index) => {
            const x = (index % cols) * maxWidth;
            const y = Math.floor(index / cols) * maxHeight;
            ctx.drawImage(img, x, y);
        });
    }

    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    img.className = 'w-full h-auto rounded shadow-sm';
    previewContainer.appendChild(img);
}

document.getElementById('downloadJoin').addEventListener('click', () => {
    if (joinImages.length === 0) {
        alert('请先上传图片');
        return;
    }

    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = 'joined_image.png';
    link.click();
});

// Add active state to join buttons
const joinButtons = document.querySelectorAll('#gridJoin, #horizontalJoin, #verticalJoin');
joinButtons.forEach(button => {
    button.addEventListener('click', () => {
        joinButtons.forEach(btn => btn.classList.remove('bg-gray-200'));
        button.classList.add('bg-gray-200');
    });
});
