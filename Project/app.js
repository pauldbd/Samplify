console.clear(); 

const audioContext = new (window.AudioContext || window.webkitAudioContext);
const primaryGainCtrol = audioContext.createGain(); 
const visualCanvas = document.getElementById("audioVizualization");
primaryGainCtrol.connect(audioContext.destination); 

let currentEffect = 0;
let currentEffectLabel = ["Master Gain", "Track Gain", "Start Time", "End Time"];
let trackGains = []; 
let startValues = []; 
let endValues = []; 
let currentPad = 0; 
let lengths = []; 
let currentData1 = []; 
let currentData2 = []; 

const audios = []; 
for (let i = 0; i < 16; i++){
    audios[i] = new Audio(); 
    trackGains[i] = audioContext.createGain(); 
    const source = audioContext.createMediaElementSource(audios[i]); 
    source.connect(trackGains[i]); 
    trackGains[i].connect(primaryGainCtrol); 
    startValues[i] = 0; 
    endValues[i] = -1; 
    lengths[i] = 0; 
}

let pointerX = null, pointerY = null, knobValue = 0; 

document.onmousemove = function(event) {
	pointerX = event.pageX;
	pointerY = event.pageY;
}

let heightRatio = 0.15;
const dpr = window.devicePixelRatio || 1;
const padding = 0;
visualCanvas.width = visualCanvas.offsetWidth * dpr;
// visualCanvas.height = (visualCanvas.offsetHeight + padding * 2) * dpr;
visualCanvas.height = visualCanvas.width * 0.12; 

const visualContext = visualCanvas.getContext("2d"); 
visualContext.translate(0, visualCanvas.height / 2 + padding); // Set Y = 0 to be in the middle of the visualCanvas
let samples = visualCanvas.width - 20; 


clearCanvas(); 
updateCurrentAudio(); 
updateFile(); 
knobUpdate(); 
keyPress(); 

async function keyPress(){
    window.addEventListener("keydown", async (event) => {

        const keys = "asdfghjklzxcvbnm";

        for (let i = 0; i < 16; i++){
            if (keys[i] == event.key){
                const file = document.getElementById("file-input"+(i+1)).files[0]; 
                if (file != null){
                    let duration = audios[i].duration; 
                    audios[i].currentTime = duration/samples * startValues[currentPad]; 
                    audios[i].play();
                    setInterval(() => {
                        if (audios[i].currentTime >= duration/samples * endValues[currentPad] && endValues[currentPad] != -1){
                            audios[i].pause(audioContext.currentTime); 
                        } 
                    }, 10)

                }

            }
        }

        updateEffectLabel(event); 



    })
}

function updateEffectLabel(e){
    if (e.keyCode == '37') {
        currentEffect -= 1; 
    }
    if (e.keyCode == '39') {
        currentEffect += 1; 
    }

    currentEffect += currentEffectLabel.length; 
    currentEffect %= currentEffectLabel.length; 
    const label = document.getElementById("effectsLabel");
    label.innerHTML = currentEffectLabel[currentEffect];

}

function updateFile(){
    for (let i = 0; i < 16; i++){
        const file = document.getElementById("file-input"+(i+1)); 
        file.addEventListener("input", function (event){
            if (!fileIsEmpty(i)) audios[i].src = URL.createObjectURL(file.files[0]); 
        })
    }
}

function updateCurrentAudio(){
    for (let i = 1; i <= 16; i++){
        const key = document.getElementById("pad-"+i); 
        const file = document.getElementById("file-input"+i); 
        key.addEventListener("contextmenu", function (event) {
            event.preventDefault()
            if (event.button == 2){
                currentPad = i-1; 
                updateAudioName(i-1);
                if (!fileIsEmpty(i-1)){
                    visualizeAudio(i-1); 
                }
                else clearCanvas(); 
            }
        }); 
        file.addEventListener("change", function(){
            updateAudioName(i-1); 
            if (!fileIsEmpty(i-1)){
                visualizeAudio(i-1); 
            }
            else clearCanvas(); 
        })
        
    }
}

function fileIsEmpty(pad){
    const file = document.getElementById("file-input" + (pad+1)); 
    return file.files[0] == undefined; 
}

function updateAudioName(pad){
    const audioLabel = document.getElementById("audioLabel"); 
    const file = document.getElementById("file-input"+(pad+1)); 
    if (fileIsEmpty(pad)){
        audioLabel.innerHTML = "Pad " + (pad+1) + ": Untitled - Click On a Pad To Add a File"; 
    }
    else{
        audioLabel.innerHTML = "Pad " + (pad+1) + ": " + file.files[0].name; 
    }
}

async function getAudioBuffer(pad, ChannelData){
    const file = document.getElementById("file-input"+(pad+1)); 
    const url = URL.createObjectURL(file.files[0]);
    const response = await(fetch(url)); 
    const arrayBuffer = await(response.arrayBuffer()); 
    const audioBuffer = await(audioContext.decodeAudioData(arrayBuffer)); 
    return audioBuffer.getChannelData(ChannelData); 
}

async function getData(pad, ChannelData){
    const rawData = await(getAudioBuffer(pad, ChannelData)); 
    lengths[pad] = rawData.length;  
    console.log(lengths[pad]); 
    const blockSize = Math.floor(rawData.length / samples);
    let filteredData = [];
    let max = 0; 

    for (let i = 0; i < samples; i++){
        let sum = 0; 
        for (let j = 0; j < blockSize; j++){
            if (!isNaN(Math.abs(rawData[j+i*blockSize])))
            sum += Math.abs(rawData[j+i*blockSize]); 
        }
        filteredData.push(sum/blockSize)
        max = Math.max(filteredData[i], max); 
    }


    const multiplyer = Math.pow(max, -1); 
    filteredData = filteredData.map(i => i * multiplyer); 
    filteredData = filteredData.map(i => i * (visualCanvas.height * 0.8))
    console.log(filteredData.length); 
    return filteredData; 

}

function clearCanvas(){
    visualContext.fillStyle = "rgb(92, 92, 91)"; 
    visualContext.clearRect(0, -visualCanvas.height, visualCanvas.width, 2 * visualCanvas.height);
    visualContext.fillRect(0, 0, visualCanvas.width, dpr); 
}

async function visualizeAudio(pad){
    clearCanvas(); 
    let filteredData = await(getData(pad, 0)); 
    currentData1 = filteredData; 
    for (let i = 0; i < samples; i++){
        visualContext.fillRect(i, 0, 1, Math.round(filteredData[i]/2))
    }
 

    filteredData = await(getData(pad,1));
    currentData2 = filteredData; 
    let i = 0; 
    for (i = 0; i < samples; i++){
        visualContext.fillRect(i, -Math.round(filteredData[i]/2), 1, Math.round(filteredData[i]/2))
    }
}

function knobUpdate(){
    const knob = document.getElementById("knob"); 
    let mouseInterval = null; 
    holding = false; 
    let prev = null;
    knob.addEventListener("mousedown", function (event){
        holding = true; 
        prev = pointerY; 
        mousetInterval = setInterval(() => {
            if (holding){
                knobValue += (prev - pointerY); 
                knob.style.transform = "rotate(" + knobValue%361 + "deg)"; 
                updateEffects(prev - pointerY); 
                prev = pointerY; 
            }
        }, 10); 
    })

    document.addEventListener("mouseup", function (event) {
        clearInterval(mouseInterval); 
        holding = false; 
    })


}


function eraseRangePoints(currentPad){
    let i = startValues[currentPad]; 

    visualContext.clearRect(i, 0, 2, visualCanvas.height)
    visualContext.clearRect(i, -visualCanvas.height, 2, 2 * visualCanvas.height)
    // visualContext.fillStyle = "red"; 
    if (i >= 0 && i < currentData1.length) {
        visualContext.fillRect(i, 0, 1, Math.round(currentData1[i]/2))
    }
    if (i >= 0 && i < currentData1.length) {
        visualContext.fillRect(i, -Math.round(currentData2[i]/2), 1, Math.round(currentData2[i]/2))
    }
    i += 1; 
    if (i >= 0 && i < currentData1.length) {
        visualContext.fillRect(i, 0, 1, Math.round(currentData1[i]/2))
    }
    if (i >= 0 && i < currentData1.length) {
        visualContext.fillRect(i, -Math.round(currentData2[i]/2), 1, Math.round(currentData2[i]/2))
    }
    visualContext.fillRect(0, 0, visualCanvas.width, dpr); 
}

function drawRangePoints(currentPad){
    let i = startValues[currentPad]; 
    visualContext.fillStyle = "black"; 
    if (i >= 0 && i < currentData1.length){
        visualContext.fillRect(i, 0, 2, visualCanvas.height)
        visualContext.fillRect(i, -visualCanvas.height, 2, visualCanvas.height)
    }
    visualContext.fillStyle = "rgb(92, 92, 91)"; 
}


function updateEffects(change){
    switch (currentEffect){
        case 0: 
            primaryGainCtrol.gain.value = Math.max(0, primaryGainCtrol.gain.value + change/100); 
            break; 
        case 1: 
            trackGains[currentPad].gain.value = Math.max(0, trackGains[currentPad].gain.value + change/100); 
            break; 
        case 2: 
            eraseRangePoints(currentPad); 
            startValues[currentPad] += change; 
            drawRangePoints(currentPad); 
            break; 
        case 3: 
            endValues[currentPad] += change; 
            break; 



    }

}