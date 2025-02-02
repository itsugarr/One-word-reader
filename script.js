let words = [];
let currentIndex = 0;
let intervalId = null;
let isPlaying = false;
let savedLocation = 0;  // Variable to store the saved location

// UI Elements
const displayCanvas = document.getElementById("displayCanvas");
const textInput = document.getElementById("textInput");
const intervalTime = document.getElementById("intervalTime");
const startButton = document.getElementById("startButton");
const playPauseButton = document.getElementById('playPauseButton');
const reverseButton = document.getElementById("reverseButton");
const skipButton = document.getElementById("skipButton");
const fullscreenButton = document.getElementById("fullscreenButton");
const exitFullscreenButton = document.getElementById("exitFullscreenButton");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const container = document.getElementById("container");
const commaPause = document.getElementById("commaPause");
const jumpTo = document.getElementById("jumpTo");
const jumpButton = document.getElementById("jumpButton");
const fullstopPause = document.getElementById("fullstopPause");
const wordLengthPauseCheckbox = document.getElementById("wordLengthPauseCheckbox");
const importButton = document.getElementById("importButton");
const libraryButton = document.getElementById("libraryButton");
const fileInput = document.getElementById("fileInput");
const saveButton = document.getElementById("saveButton"); // New Save Button
const authur = document.getElementById("authur"); // Assuming you have an 'author' element
const displayArea = document.getElementById('displayArea');
const fontSelect = document.getElementById('fontSelect');
const colorPicker = document.getElementById('colorPicker');

importButton.addEventListener("click", () => {
  fileInput.click();  // Trigger the hidden file input
});


function extractSavedLocation(fileContent) {
  const savedLocationMatch = fileContent.match(/currentsavedlocation = (\d+);/);
  if (savedLocationMatch) {
    savedLocation = parseInt(savedLocationMatch[1], 10);  // Set the saved location if found
    // Update the words array, skipping the line with 'currentsavedlocation'
    words = fileContent.split(/\r?\n/).filter(line => !line.includes('currentsavedlocation'));
    currentIndex = savedLocation;  // Start displaying from the saved location
    updateProgressBar();  // Update the progress bar after setting the saved location
    startButton.textContent = "Start Over";  // Set the button to "Start Over" when there's progress
  } else {
    words = fileContent.split(/\r?\n/);  // No saved location, split text normally
    startButton.textContent = "Start";  // Set the button to "Start" if no progress exists
  }
  updateDisplay();  // Update the display after processing the file
}

function updateProgressBar() {
  const progress = (currentIndex / words.length) * 100;
  console.log('Progress:', progress);  // Log the progress value to check
  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${Math.round(progress)}%`;
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file && file.type === "text/plain") {
    const reader = new FileReader();
    reader.onload = (e) => {
      textInput.value = e.target.result;  // Load file content into text area
      extractSavedLocation(e.target.result);  // Extract saved location from file content
    };
    reader.readAsText(file);
  } else {
    alert("Please upload a valid .txt file.");
  }
});

document.getElementById("libraryButton").addEventListener("click", function() {
  window.location.href = "cloud-library.html";  // Navigate to the library page
});

function returnSelectedFile(content) {
  localStorage.setItem("selectedFileData", content);  // Store file data temporarily
  window.location.href = "index.html";  // Redirect back to main page
}

window.addEventListener("load", function() {
  const fileData = localStorage.getItem("selectedFileData");
  if (fileData) {
    textInput.value = fileData;
    extractSavedLocation(fileData);
    localStorage.removeItem("selectedFileData"); // Remove after loading
  }
});

function getDisplayedWordLength() {
  return displayCanvas.textContent.replace(/[^a-zA-Z]/g, "").length;
}

function updateDisplay() {
  if (currentIndex >= words.length) {
    displayCanvas.textContent = "THE END.";
    isPlaying = false;
    clearTimeout(intervalId);
    return;
  }
  displayCanvas.textContent = words[currentIndex];
}

saveButton.addEventListener("click", () => {
  const fileName = prompt("Enter file name:", "saved_text.txt");
  if (!fileName) return; // Cancel if user presses Cancel or enters nothing

  const fileContent = `currentsavedlocation = ${currentIndex};\n` + words.join("\n");
  const blob = new Blob([fileContent], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName.endsWith(".txt") ? fileName : fileName + ".txt"; // Ensure .txt extension
  link.click();
});
function updateProgressBar() {
  const progress = (currentIndex / words.length) * 100;
  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${Math.round(progress)}%`;
}

function getPauseDuration(word) {
  const baseTime = parseInt(intervalTime.value);
  let extraPause = 0;

  if (/[.!?]$/.test(word)) {
    extraPause += parseInt(fullstopPause.value);
  } else if (/[,;:]$/.test(word)) {
    extraPause += parseInt(commaPause.value);
  }

  const displayedWordLength = getDisplayedWordLength();
  if (wordLengthPauseCheckbox.checked && displayedWordLength > 6) {
    extraPause += baseTime/20 * Math.pow(Math.abs(displayedWordLength - 6), 1.5);
  }

  return baseTime + extraPause;
}

function nextWord() {
  if (currentIndex >= words.length) {
    clearTimeout(intervalId);
    isPlaying = false;
    return;
  }
  updateDisplay();   // Ensure the display is updated
  updateProgressBar();   // Update the progress bar
  const delay = getPauseDuration(words[currentIndex]);
  currentIndex++;
  clearTimeout(intervalId);
  intervalId = setTimeout(nextWord, delay);
}

function startDisplay() {
  if (isPlaying) {
    resetProgress(); // If the display is playing, reset it and pause
    return;
  }

  const text = textInput.value.trim();

  const lines = text.split(/\r?\n/);
  const locationLine = lines.findIndex(line => line.includes('currentsavedlocation ='));

  if (locationLine !== -1) {
    const locationMatch = lines[locationLine].match(/currentsavedlocation = (\d+);/);
    if (locationMatch) {
      savedLocation = parseInt(locationMatch[1], 10);
    }
    lines.splice(locationLine, 1);
  }

  words = lines.join(' ').trim().split(/\s+/);
  if (words.length === 0) return;

  currentIndex = 0;
  isPlaying = true;
  playPauseButton.textContent = 'Pause'; // Ensure correct button text
  nextWord();

  startButton.textContent = "Start Over";
}

function resetProgress() {
  // Pause first, reset progress, and then change button text to "Start"
  pauseDisplay();  
  currentIndex = 0;
  isPlaying = false;
  updateDisplay();
  updateProgressBar();
  startButton.textContent = "Start";  // Set button text to "Start"
}

function pauseDisplay() {
  clearTimeout(intervalId);
  isPlaying = false;
  playPauseButton.textContent = 'Play'; // Ensure button syncs to 'Play'
}

function resumeDisplay() {
  if (!isPlaying && currentIndex < words.length) {
    isPlaying = true;
    nextWord();
    playPauseButton.textContent = 'Pause'; // Ensure button syncs to 'Pause'
  }
}


function reverseWord() {
  pauseDisplay();
  currentIndex = Math.max(0, currentIndex - 15);
  updateDisplay();
  updateProgressBar();
}

function skipWord() {
  pauseDisplay();
  currentIndex = Math.min(words.length - 1, currentIndex + 15);
  updateDisplay();
  updateProgressBar();
}

function enterFullscreen() {
  container.requestFullscreen().then(() => {
    container.classList.add("fullscreen");
    fullscreenButton.style.display = "none";
    jumpButton.style.display = "none";
    exitFullscreenButton.style.display = "inline-block";
    importButton.style.display = "none";  
    libraryButton.style.display = "none";
    saveButton.style.display = "none";    
    authur.style.display = "none";        
    colorPicker.style.display = "none";  // Hide color picker
    fontSelect.style.display = "none";   // Hide font selector
    pauseDisplay();
  });
}


function exitFullscreen() {
  document.exitFullscreen().then(() => {
    container.classList.remove("fullscreen");
    fullscreenButton.style.display = "inline-block";
    exitFullscreenButton.style.display = "none";
    jumpButton.style.display = "inline-block";
    restoreLayout(); 
    pauseDisplay();
  });
}


colorPicker.addEventListener("input", function() {
  displayCanvas.style.color = this.value;
});

fontSelect.addEventListener("change", function() {
  displayCanvas.style.fontFamily = this.value;
});

function restoreLayout() {
  importButton.style.display = "inline-block";  
  libraryButton.style.display = "inline-block";
  saveButton.style.display = "inline-block";    
  authur.style.display = "inline-block";        
  colorPicker.style.display = "inline-block";   // Show color picker again
  fontSelect.style.display = "inline-block";    // Show font selector again
}


document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    // This means fullscreen has been exited (e.g., via Esc key)
    container.classList.remove("fullscreen");
    fullscreenButton.style.display = "inline-block";
    exitFullscreenButton.style.display = "none";
    jumpButton.style.display = "inline-block";
    restoreLayout(); // Restore layout for import, save buttons, and author
    pauseDisplay();  // Optionally pause the display when exiting fullscreen
  }
});

document.addEventListener('keydown', (event) => {
  switch (event.key) {
    case ' ':
      event.preventDefault();
      playPauseButton.click(); // Trigger button click for play/pause
      break;
    case 'ArrowRight':
      skipWord();
      break;
    case 'ArrowLeft':
      reverseWord();
      break;
    case 'ArrowUp':
      adjustSpeed(true);
      break;
    case 'ArrowDown':
      adjustSpeed(false);
      break;
    case 'f':
      if (!document.fullscreenElement) {
        enterFullscreen();
      } else {
        exitFullscreen();
      }
      break;
  }
});



fullscreenButton.addEventListener("click", enterFullscreen);
exitFullscreenButton.addEventListener("click", exitFullscreen);
startButton.addEventListener("click", startDisplay);

jumpButton.addEventListener("click", () => {
  const jumpPercent = Math.min(100, Math.max(0, parseInt(jumpTo.value)));
  currentIndex = Math.floor((jumpPercent / 100) * words.length);
  pauseDisplay();
  updateDisplay();
  updateProgressBar();
});

playPauseButton.addEventListener('click', () => {
  if (isPlaying) {
    pauseDisplay();
  } else {
    resumeDisplay();
  }
});



reverseButton.addEventListener("click", reverseWord);
skipButton.addEventListener("click", skipWord);
