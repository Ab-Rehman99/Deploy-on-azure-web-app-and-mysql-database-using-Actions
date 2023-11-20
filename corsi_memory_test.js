const gameContainer = document.getElementById("game-container");
const blocksContainer = document.getElementById("blocks-container");
const startButton = document.getElementById("start-button");
const doneButton = document.getElementById("done-button");
const feedback = document.getElementById("feedback");
const nextTestButton = document.getElementById("next-test");


const numberOfBlocks = 9;
const blocks = [];
const blockSequence = [];
let userSequence = [];
let sequenceLength = 2;
let attempts = 0;

const gridSize = 32;
const gridSpacing = 100 / gridSize;



function generateRandomPosition(block) {
  const randomX = Math.floor(Math.random() * gridSize);
  const randomY = Math.floor(Math.random() * gridSize);

  block.style.left = `${randomX * gridSpacing}%`;
  block.style.top = `${randomY * gridSpacing}%`;
}
document.addEventListener('click', function() {
  html2canvas(document.body).then(canvas => {
      const imgDataUrl = canvas.toDataURL("image/png");

      // Sending AJAX request to Flask backend
      fetch('http://localhost:5000/upload', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `image=${encodeURIComponent(imgDataUrl)}`
      })
      .then(response => response.json())
      .then(data => {
          console.log('Image saved:', data);
      })
      .catch((error) => {
          console.error('Error:', error);
      });
  });
});
const title = document.querySelector("h1");

for (let i = 0; i < numberOfBlocks; i++) {
  const block = document.createElement("div");
  block.classList.add("block", "hidden");
  generateRandomPosition(block);
  block.addEventListener("click", () => {
    if (!block.classList.contains("active")) return;
    userSequence.push(block);
    block.classList.toggle("highlight");
  });
  blocksContainer.appendChild(block);
  blocks.push(block);
}


  startButton.addEventListener("click", () => {
    blocks.forEach(block => block.classList.remove("hidden"));
    startButton.style.display = "none";
    title.style.display = "none";
    
    showSequence();
  });
startButton.addEventListener("click", () => {
  startButton.style.display = "none";
  showSequence();
});

doneButton.addEventListener("click", () => {
  checkUserSequence();
  userSequence.forEach(block => {
    block.classList.remove("highlight");
  });
});
function downloadCsvFile(data, filename) {
  const csvData = new Blob([data], {type: 'text/csv;charset=utf-8;'});
  const csvUrl = URL.createObjectURL(csvData);
  const link = document.createElement('a');
  link.href = csvUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function showSequence() {
  doneButton.style.display = "none";
  feedback.style.display = "none";
  userSequence = [];
  generateSequence();
  let index = 0;
  const interval = setInterval(() => {
    if (index < blockSequence.length) {
      blockSequence[index].classList.add("highlight");

      // Get the dimensions and position of the highlighted block
      const blockRect = blockSequence[index].getBoundingClientRect();
      
      // Save the highlighted block data
      processHighlightedBlocksData({
        index: index + 1,
        x: blockRect.x,
        y: blockRect.y,
        width: blockRect.width,
        height: blockRect.height,
        timestamp: new Date().getTime(),
      });

      setTimeout(() => {
        blockSequence[index].classList.remove("highlight");
        index++;
      }, 500);
    } else {
      clearInterval(interval);
      setTimeout(() => {
        blocks.forEach(block => block.classList.add("active"));
        doneButton.style.display = "block";
      }, 500);
    }
  }, 1000);
}
function processHighlightedBlocksData(data) {
  // Find the next available sequence number for the filename
  let sequenceNumber = 1;
  while (localStorage.getItem(`seq_${sequenceNumber}`) !== null) {
    sequenceNumber += 1;
  }

  // Save the JSON data to local storage to keep track of used sequence numbers
  localStorage.setItem(`seq_${sequenceNumber}`, JSON.stringify(data));
}

function generateSequence() {
  blockSequence.length = 0;
  for (let i = 0; i < sequenceLength; i++) {
    const randomBlock = blocks[Math.floor(Math.random() * blocks.length)];
    blockSequence.push(randomBlock);
  }
}

function hideBlocks() {
  blocks.forEach(block => block.classList.add("hidden"));
}


function checkUserSequence() {
  blocks.forEach(block => block.classList.remove("active"));
  doneButton.style.display = "none";

  const isCorrect =
    userSequence.length === blockSequence.length &&
    userSequence.every((block, index) => block === blockSequence[index]);

  if (isCorrect) {
    feedback.textContent = "😃";
    sequenceLength++;
    attempts = 0;
  } else {
    feedback.textContent = "☹️"
    attempts++;
    if (attempts === 2) {
      setTimeout(() => hideBlocks(), 1000);
      feedback.textContent += ` Game Over! Your Corsi Block Span is ${sequenceLength - 1}.`;
      nextTestButton.style.display = "block";
      saveResults(sequenceLength-1);

    }
}
feedback.style.display = "block";

if (attempts < 2) { setTimeout(() => { showSequence(); }, 2000); } }
function gatherSequences() {
  const sequenceData = [];
  let sequenceNumber = 1;

  while (localStorage.getItem(`seq_${sequenceNumber}`) !== null) {
    const seq = JSON.parse(localStorage.getItem(`seq_${sequenceNumber}`));
    sequenceData.push(seq);
    sequenceNumber += 1;
  }

  return sequenceData;
}


//const startTutorialButton = document.getElementById("start-tutorial-button");
//startTutorialButton.addEventListener("click", function () {
//    window.location.href = "corsi_memory_test/corsi_memory_test.html";
//});

nextTestButton.addEventListener("click", function () {
  // Gather all sequences from local storage
  const allSequences = gatherSequences();

  // Convert the gathered sequences to CSV format
  const csvData = jsonToCsv(allSequences);

  // Download the CSV file
  downloadCsvFile(csvData, "all_sequences.csv");

  // Redirect to the next test
    window.location.href = "../Perspective_taking_test/tutorial.html";
});

function jsonToCsv(jsonData) {
  const replacer = (key, value) => (value === null ? '' : value);
  const header = Object.keys(jsonData[0]);
  const csv = [
    header.join(','),
    ...jsonData.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n');
  
  return csv;
}
function saveResults(seq) {
    // Convert user sequence to comma-separated string
    const resultString = userSequence.map(block => blocks.indexOf(block) + 1).join(",");
    const resultObj = {
        type: 'corsiBlockSpan',
        score: sequenceLength - 1,
        sequence: resultString
    };

    // Retrieve existing results from local storage
    let existingResults = localStorage.getItem("results");
    if (existingResults) {
        // If there are existing results, parse them
        existingResults = JSON.parse(existingResults);
    } else {
        // If there are no existing results, initialize an empty array
        existingResults = [];
    }

    // Add the new results to the existing results array
    existingResults.push(resultObj);

    // Update local storage with the combined results
    localStorage.setItem("results", JSON.stringify(existingResults));
}

function validateLogin() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;

  // Perform basic validation - this can be expanded for a real login system
  if (username === "admin" && password === "123") {
      window.location.href = "corsi_memory_test.html"; // Redirect to the test page
  } else {
      alert("Invalid username or password. Please try again.");
  }
}

function validateLogin() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;

  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
    .then(response => {
      if (response.ok) {
        window.location.href = "corsi_memory_test.html"; // Redirect to the test page
      } else {
        return response.json();
      }
    })
    .then(data => {
      if (data && data.error) {
        alert(data.error);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}



