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
let currentEffectLabel = ["Master Gain: ", "Track Gain: ", "Start Time: ", "End Time: "];
let trackGains = []; 
let muteGains = []; 
let startValues = []; 
let endValues = []; 
let currentPad = 0; 
let lengths = []; 
let currentData1 = []; 
let currentData2 = []; 
let isMuted = []; 
let isReplay = []; 
let copiedPad = -1; 

const audios = []; 
for (let i = 0; i < 16; i++){
    audios[i] = new Audio(); 
    trackGains[i] = audioContext.createGain(); 
    muteGains[i] = audioContext.createGain(); 
    const source = audioContext.createMediaElementSource(audios[i]); 
    source.connect(trackGains[i]); 
    trackGains[i].connect(muteGains[i]);
    muteGains[i].connect(primaryGainCtrol);  
    startValues[i] = 0; 
    endValues[i] = samples; 
    lengths[i] = 0; 
    isMuted[i] = false; 
    isReplay[i] = false; 
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
updateCopyAndPaste(); 
mute(); 
reset(); 
replay(); 
keyPress(); 

function setUpHtml(){
    const keys = "qwertyuiasdfghjk";
    for (let i = 1; i <= 16; i++){
        const label = document.getElementById("label-" + i); 
        label.innerHTML = keys[i-1].toUpperCase(); 
    }
}

async function keyPress(){
    window.addEventListener("keydown", async (event) => {

        const keys = "qwertyuiasdfghjk";

        for (let i = 0; i < 16; i++){
            if (keys[i] == event.key){
                const file = document.getElementById("file-input"+(i+1)).files[0]; 
                console.log(file); 
                const key = document.getElementById("pad-"+(i+1)); 
                key.style.backgroundColor = "rgb(124, 123, 123)";
                if (file != null){
                    audios[i].currentTime = (audios[i].duration/samples * startValues[i]); 
                    audios[i].play();
                    let playInterval = setInterval(() => {
                        if (audios[i].currentTime >= (audios[i].duration/samples * endValues[i])){
                            audios[i].pause(audioContext.currentTime);
                            if (isReplay[i]){
                                audios[i].play(audioContext.currentTime); 
                            }
                            else{
                                clearInterval(playInterval); 
                            }
                        } 
                    }, 10)

                }

            }
        }

        updateEffectLabel(event); 



    })
    window.addEventListener("keyup", async (event) => {

        const keys = "qwertyuiasdfghjk";

        for (let i = 0; i < 16; i++){
            if (keys[i] == event.key){
                const key = document.getElementById("pad-"+(i+1));
                setTimeout(function() {
                    key.style.backgroundColor = "rgb(148, 148, 148)"; 
                  }, 160); 
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
    let string = ""; 
    switch (currentEffect){
        case 0:
            let masterGain = parseFloat(20 * log10(primaryGainCtrol.gain.value)).toFixed(2); 
            string += " " + masterGain + " dB"; 
            break; 
        case 1: 
            let trackGain = parseFloat(20 * log10(trackGains[currentPad].gain.value)).toFixed(2); 
            string += " " + trackGain + " dB"; 
            break; 
        case 2: 
            let Time = (audios[currentPad].duration/samples * startValues[currentPad]); 
            let startMin = parseFloat(Time/60).toFixed(0); 
            let startSec = parseFloat(Time - startMin).toFixed(2); 
            if (isNaN(audios[currentPad].duration)){
                string = " 0:0.0"; 
            }
            else{
                string += " " + startMin + ":" + startSec; 
            }
            break; 
        case 3:
            let endTime = (audios[currentPad].duration/samples * endValues[currentPad]); 
            let endMin = parseFloat(endTime/60).toFixed(0); 
            let endSec = parseFloat(endTime - endMin).toFixed(2); 
            if (isNaN(audios[currentPad].duration)){
                string += " 0:0.0"; 
            }
            else{
                string += " " + endMin + ":" + endSec; 
            }
            break; 
    }
    label.innerHTML = currentEffectLabel[currentEffect] + string;

}

function updateCurrentAudio(){
    for (let i = 1; i <= 16; i++){
        const key = document.getElementById("pad-"+i); 
        const file = document.getElementById("file-input"+i); 
        key.addEventListener("contextmenu", function (event) {
            outline(currentPad, i-1); 
            currentPad = i-1; 
            event.preventDefault()
            muteColor(); 
            replayColor(); 
            currentData1 = []; 
            currentData2 = []; 
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
            outline(currentPad, i-1); 
            currentPad = i-1; 
            endValues[i-1] = samples-1; 
            startValues[i-1] = 0; 
            currentData1 = []; 
            currentData2 = []; 
            isReplay[i] = false; 
            isMuted[i] = false; 
            updateAudioName(i-1); 
            muteColor(); 
            replayColor(); 
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

function outline(oldPad, pad){
    const oldKey = document.getElementById("pad-"+(oldPad+1)); 
    const newKey = document.getElementById("pad-"+(pad+1)); 

    oldKey.style.transform = "scale(1)"; 
    oldKey.style.outline = "none"; 
    newKey.style.outline = "solid rgb(102, 102, 102) 2px"; 
    newKey.style.transform = "scale(0.95)"; 

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
        mouseInterval = setInterval(() => {
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

    updateEffectLabel(0); 

}

function updateCopyAndPaste(){
    const copyButton = document.getElementById("copyButton"); 
    const pasteButton = document.getElementById("pasteButton"); 
    
    copyButton.addEventListener("click", function (event){
        copiedPad = currentPad; 
        console.log(copiedPad); 
    })

    pasteButton.addEventListener("click", function (event){
        const file = document.getElementById("file-input"+(currentPad+1)); 
        file.files = document.getElementById("file-input"+(copiedPad+1)).files; 
        audios[currentPad].src = URL.createObjectURL(file.files[0]); 
        updateAudioName(currentPad);
        visualizeAudio(currentPad); 
    })

    

}

function muteColor(){
    const muteButton = document.getElementById("muteButton"); 
    if (isMuted[currentPad]){
        muteButton.style.backgroundColor = "rgb(92, 92, 91)"; 
    }
    else{
        muteButton.style.backgroundColor = "rgb(182, 182, 182)"; 
    }
}

function replayColor(){
    const replayButton = document.getElementById("replayButton"); 
    if (isReplay[currentPad]){
        replayButton.style.backgroundColor = "rgb(92, 92, 91)"; 
    }
    else{
        replayButton.style.backgroundColor = "rgb(182, 182, 182)"; 
    }
}

function mute(){
    const muteButton = document.getElementById("muteButton"); 
    muteButton.addEventListener("click", function (event){  
        isMuted[currentPad] = !isMuted[currentPad]; 
        if (isMuted[currentPad]){
            muteGains[currentPad].gain.value = 0; 
        }
        else{
            muteGains[currentPad].gain.value = 1; 
        }

        muteColor();



    })
}

function replay(){
    const replayButton = document.getElementById("replayButton"); 
    replayButton.addEventListener("click", function (event){  
        isReplay[currentPad] = !isReplay[currentPad]; 
        replayColor();
    })
}

function reset(){
    const resetButton = document.getElementById("resetButton"); 

    resetButton.addEventListener("click", function(event){
        switch(currentEffect){
            case 0: 
                primaryGainCtrol.gain.value = 1;
                break; 
            case 1: 
                trackGains[currentPad].gain.value = 1; 
                break; 
            case 2: 
                eraseRangePoints(startValues[currentPad]); 
                startValues[currentPad] = 0; 
                drawRangePoints(startValues[currentPad]); 
                break; 
            case 3: 
                eraseRangePoints(endValues[currentPad])
                endValues[currentPad] = samples-1; 
                drawRangePoints(endValues[currentPad])
                break; 
    

        }
        updateEffectLabel(0); 
    })
}

function log10(x) {
    return Math.log(x)/Math.LN10;
}