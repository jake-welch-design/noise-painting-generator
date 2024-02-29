let img;
let imgEffect;
let lowResImg;
let isAdjusting = false; // Flag to indicate if the resolution should be temporarily lowered

let font;
let windowRatio;

let refresh = false;
let noiseScale = 0.01;
let noiseAmount = 56;
let noiseTime = 0;
let noiseScaleSlider, noiseAmountSlider, noiseTimeSlider, refreshButton, saveImgButton, chooseFileButton, chooseFileInput;
let applyGrayscale = false; 


function preload() {
  font = loadFont('fonts/Satoshi-Regular.otf'); // Ensure the font path is correct
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.drop(gotFile);
  pixelDensity(1);
  frameRate(12);
  background(0);

  setupUI(); // Set up UI elements
}

function setupUI() {
  textAlign(CENTER, CENTER);
  textFont(font);
  textSize(24);
  fill(255);

  text("Drag & drop your image\nor click 'Choose file'", windowWidth / 2, windowHeight / 2);

  noiseAmountSlider = createSlider(0, 500, 0, 1);
  noiseAmountSlider.position(10, 75);
  noiseAmountSlider.input(() => refreshCanvas());
  noiseAmountSlider.mousePressed(() => isAdjusting = true);
  noiseAmountSlider.mouseReleased(() => finishAdjusting());
  noiseAmountSlider.addClass('sliderStyle');
  noiseAmountSlider.parent('slider-container');
  
  noiseScaleSlider = createSlider(0.001, 0.1, 0.001,0.001);
  noiseScaleSlider.position(10, 123);
  noiseScaleSlider.input(() => refreshCanvas());
  noiseScaleSlider.mousePressed(() => isAdjusting = true);
  noiseScaleSlider.mouseReleased(() => finishAdjusting());
  noiseScaleSlider.addClass('sliderStyle');
  noiseScaleSlider.parent('slider-container');

  noiseTimeSlider = createSlider(0, 100, 0, 1);
  noiseTimeSlider.position(10, 170);
  noiseTimeSlider.input(() => refreshCanvas());
  noiseTimeSlider.mousePressed(() => isAdjusting = true);
  noiseTimeSlider.mouseReleased(() => finishAdjusting());
  noiseTimeSlider.addClass('sliderStyle');
  noiseTimeSlider.parent('slider-container');

  monochromeButton = createButton('Monochrome');
  monochromeButton.position(10, 195);
  monochromeButton.mousePressed(() => {
    isAdjusting = true;
    applyGrayscale = !applyGrayscale;
    refreshCanvas(); 
  });
  monochromeButton.mouseReleased(() => finishAdjusting());
  monochromeButton.parent('slider-container');

  refreshButton = createButton('Reset');
  refreshButton.position(10, 225);
  refreshButton.mousePressed(() => {
    isAdjusting = true
    reset();
  });
  refreshButton.mouseReleased(() => finishAdjusting());
  refreshButton.parent('slider-container');

  saveImgButton = createButton('Save');
  saveImgButton.position(10, 255);
  saveImgButton.mousePressed(() => save('noise-painting.jpeg'));
  saveImgButton.parent('slider-container');

  chooseFileButton = createButton('Choose file');
  chooseFileButton.position(10, 285);
  chooseFileButton.mousePressed(() => chooseFileInput.elt.click());
  chooseFileButton.parent('slider-container');

  chooseFileInput = createFileInput(handleFile);
  chooseFileInput.style('display', 'none');
}

function refreshCanvas() {
  refresh = true;
  loop();
}

function reset(){
    noiseScaleSlider.value(0.01);
    noiseAmountSlider.value(0);
    noiseTimeSlider.value(0);
    applyGrayscale = false; 
    refresh = true;
    loop();
}

function gotFile(file) {
  if (file.type === 'image') {
    isAdjusting = true; 
    loadImage(file.data, (loadedImage) => {
      img = loadedImage;
      finishAdjusting(); 
    });
  } else {
    console.log('Not an image file!');
  }
}

function handleFile(file) {
  gotFile(file); // Reuse the gotFile function for consistency
}

function draw() {
  if (refresh) {
    clearBackground();
    if (img && img.width > 0) {
      displayImage();
    }
    refresh = false;
  }
}

function clearBackground() {
  clear();
  background(0);
}

function finishAdjusting() {
  isAdjusting = false;
  refreshCanvas(); // This will ensure a redraw with full effects
}

function displayImage() {
  windowRatio = windowWidth / windowHeight;
  let imgRatio = img.width / img.height;
  let drawWidth, drawHeight, xOffset = 0, yOffset = 0;

  if (imgRatio > windowRatio) {
    drawWidth = windowWidth;
    drawHeight = drawWidth / imgRatio;
    yOffset = (windowHeight - drawHeight) / 2;
  } else {
    drawWidth = windowHeight * imgRatio;
    drawHeight = windowHeight;
    xOffset = (windowWidth - drawWidth) / 2;
  }

  if (isAdjusting) {
    if (!lowResImg || refresh) {
      lowResImg = img.get();
      lowResImg.resize(drawWidth * 0.05, 0); 
      noSmooth();
    }
    image(lowResImg, xOffset, yOffset, drawWidth, drawHeight);
    if (applyGrayscale) {
      filter(GRAY); 
    }
    push();
    rectMode(CENTER);
    fill('red')
    noStroke();
    rect(windowWidth / 2, windowHeight / 2 + 6,180,50);
    fill('white');
    textSize(36);
    textFont(font);
    textAlign(CENTER, CENTER);
    text("LOADING", windowWidth / 2, windowHeight / 2);
    pop();
  } else {  
  
    if (refresh) { 
      imgEffect = offsetPixels(img);
      refresh = false; 
    }
    image(imgEffect, xOffset, yOffset, drawWidth, drawHeight);
    if (applyGrayscale) {
      filter(GRAY); 
    }
  }
}

function offsetPixels(originalImg) {
  noiseScale = noiseScaleSlider.value();
  noiseAmount = noiseAmountSlider.value();
  noiseTime = noiseTimeSlider.value();

  originalImg.loadPixels();
  let newImg = createImage(originalImg.width, originalImg.height);
  newImg.loadPixels();

  for (let x = 0; x < originalImg.width; x++) {
    for (let y = 0; y < originalImg.height; y++) {
      let index = 4 * (y * originalImg.width + x);
      let offsetX = noise(x * noiseScale, y * noiseScale, noiseTime) * noiseAmount;
      let offsetY = noise((x + 1000) * noiseScale, (y + 1000) * noiseScale, noiseTime) * noiseAmount;
      let newX = (int(x + offsetX) + originalImg.width) % originalImg.width;
      let newY = (int(y + offsetY) + originalImg.height) % originalImg.height;
      let newIndex = 4 * (newY * originalImg.width + newX);

      for (let i = 0; i < 4; i++) {
        newImg.pixels[index + i] = originalImg.pixels[newIndex + i];
      }
    }
  }
  newImg.updatePixels();
  return newImg;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  refreshCanvas();
}