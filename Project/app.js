console.clear(); 

const audioContext = new (window.AudioContext || window.webkitAudioContext);
const primaryGainCtrol = audioContext.createGain(); 
const visualCanvas = document.getElementById("audioVizualization");
primaryGainCtrol.connect(audioContext.destination); 

let heightRatio = 0.15;
const dpr = window.devicePixelRatio || 1;
const padding = 0;
visualCanvas.width = visualCanvas.offsetWidth * dpr;
// visualCanvas.height = (visualCanvas.offsetHeight + padding * 2) * dpr;
visualCanvas.height = visualCanvas.width * 0.12; 

const visualContext = visualCanvas.getContext("2d"); 
visualContext.translate(0, visualCanvas.height / 2 + padding); // Set Y = 0 to be in the middle of the visualCanvas
let samples = visualCanvas.width; 

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
    endValues[i] = samples; 
    lengths[i] = 0; 
}

let pointerX = null, pointerY = null, knobValue = 0; 

document.onmousemove = function(event) {
	pointerX = event.pageX;
	pointerY = event.pageY;
}


clearCanvas(); 
setUpHtml(); 
updateCurrentAudio(); 
knobUpdate(); 
keyPress(); 

function setUpHtml(){
    const keys = "1234qwerasdfzxcv";
    for (let i = 1; i <= 16; i++){
        const label = document.getElementById("label-" + i); 
        label.innerHTML = keys[i-1]; 
    }
}

async function keyPress(){
    window.addEventListener("keydown", async (event) => {

        const keys = "1234qwerasdfzxcv";

        for (let i = 0; i < 16; i++){
            if (keys[i] == event.key){
                const file = document.getElementById("file-input"+(i+1)).files[0]; 
                const key = document.getElementById("pad-"+(i+1)); 
                key.style.backgroundColor = "rgb(124, 123, 123)"; 
                if (file != null){
                    audios[i].currentTime = (audios[i].duration/samples * startValues[i]); 
                    audios[i].play();
                    setInterval(() => {
                        if (audios[i].currentTime >= (audios[i].duration/samples * endValues[i])){
                            audios[i].pause(audioContext.currentTime); 
                        } 
                    }, 10)

                }

            }
        }

        updateEffectLabel(event); 



    })
    window.addEventListener("keyup", async (event) => {

        const keys = "1234qwerasdfzxcv";

        for (let i = 0; i < 16; i++){
            if (keys[i] == event.key){
                const key = document.getElementById("pad-"+(i+1));
                setTimeout(function() {
                    key.style.backgroundColor = "rgb(148, 148, 148)"; 
                  }, 170); 
            }
        }


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

function updateCurrentAudio(){
    for (let i = 1; i <= 16; i++){
        const key = document.getElementById("pad-"+i); 
        const file = document.getElementById("file-input"+i); 
        key.addEventListener("contextmenu", function (event) {
            currentPad = i-1; 
            event.preventDefault()
            if (event.button == 2){
                updateAudioName(i-1);
                if (!fileIsEmpty(i-1)){
                    visualizeAudio(i-1); 
                    drawRangePoints(startValues[currentPad])
                    drawRangePoints(endValues[currentPad])
                }
                else clearCanvas();
            }
        }); 
        file.addEventListener("input", function(){
            currentPad = i-1; 
            endValues[i-1] = samples-1; 
            startValues[i-1] = 0; 
            updateAudioName(i-1); 
            if (!fileIsEmpty(i-1)){
                audios[i-1].src = URL.createObjectURL(file.files[0])
                visualizeAudio(i-1); 
                drawRangePoints(startValues[currentPad])
                drawRangePoints(endValues[currentPad])
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


function eraseRangePoints(i){

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
    if (i >= 0 && i < samples) {
        visualContext.fillRect(i, 0, 1, Math.round(currentData1[i]/2))
    }
    if (i >= 0 && i < samples) {
        visualContext.fillRect(i, -Math.round(currentData2[i]/2), 1, Math.round(currentData2[i]/2))
    }
    visualContext.fillRect(0, 0, visualCanvas.width, dpr); 
}

function drawRangePoints(i){
    visualContext.fillStyle = "black"; 
    if (i >= 0 && i <= samples){
        console.log('a'); 
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
            eraseRangePoints(startValues[currentPad]); 
            startValues[currentPad] += change; 
            drawRangePoints(startValues[currentPad]); 
            break; 
        case 3: 
            eraseRangePoints(endValues[currentPad])
            endValues[currentPad] += change; 
            drawRangePoints(endValues[currentPad])
            break; 



    }

}