const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const downloadBtn = document.getElementById('downloadBtn');
const undoBtn = document.getElementById('undoBtn');
const resetBtn = document.getElementById('resetBtn');
const colorPreview = document.getElementById('colorPreview');
const colorInput = document.getElementById('colorInput');
const applyColorBtn = document.getElementById('applyColorBtn');
const colorPalette = document.getElementById('colorPalette');

let img = new Image();
let selectedColor = null;
let history = []; // Histórico de estados da imagem
let originalImageData = null; // Imagem original

// Upload da imagem
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            img.src = event.target.result;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                history = [originalImageData];
                enableButtons();
                generateColorPalette();
            };
        };
        reader.readAsDataURL(file);
    }
});

// Conta-gotas
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    selectedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    colorPreview.style.backgroundColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    colorInput.value = hex;
});

// Gerar paleta de cores
function generateColorPalette() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorMap = new Map();
    
    for (let i = 0; i < imageData.length; i += 40) { // Amostragem reduzida para performance
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const key = `${r},${g},${b}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    const sortedColors = [...colorMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key]) => key.split(',').map(Number));

    colorPalette.innerHTML = '';
    sortedColors.forEach(([r, g, b]) => {
        const hex = rgbToHex(r, g, b);
        const item = document.createElement('div');
        item.className = 'palette-item';
        item.innerHTML = `
            <div class="palette-color" style="background-color: rgb(${r}, ${g}, ${b});"></div>
            <span class="palette-hex">${hex}</span>
        `;
        item.addEventListener('click', () => {
            selectedColor = { r, g, b };
            colorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            colorInput.value = hex;
        });
        colorPalette.appendChild(item);
    });
}

// Converter RGB para HEX
function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

// Converter HEX para RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

// Aplicar nova cor
applyColorBtn.addEventListener('click', () => {
    if (!selectedColor || !colorInput.value) {
        alert('Selecione uma cor e insira um novo HEX!');
        return;
    }

    const newColor = hexToRgb(colorInput.value);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i] === selectedColor.r && data[i + 1] === selectedColor.g && data[i + 2] === selectedColor.b) {
            data[i] = newColor.r;
            data[i + 1] = newColor.g;
            data[i + 2] = newColor.b;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    enableButtons();
});

// Desfazer
undoBtn.addEventListener('click', () => {
    if (history.length > 1) {
        history.pop();
        ctx.putImageData(history[history.length - 1], 0, 0);
        enableButtons();
    }
});

// Restaurar original
resetBtn.addEventListener('click', () => {
    if (originalImageData) {
        ctx.putImageData(originalImageData, 0, 0);
        history = [originalImageData];
        enableButtons();
    }
});

// Download
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'xpg-edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// Habilitar/desabilitar botões
function enableButtons() {
    downloadBtn.disabled = false;
    applyColorBtn.disabled = false;
    undoBtn.disabled = history.length <= 1;
    resetBtn.disabled = history.length === 1 && ctx.getImageData(0, 0, canvas.width, canvas.height).data.every((v, i) => v === originalImageData.data[i]);
}
