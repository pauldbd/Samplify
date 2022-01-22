console.clear(); 

const audioContext = new (window.AudioContext || window.webkitAudioContext);
const primaryGainCtrol = audioContext.createGain(); 
const audioVizualizationCanvas = document.getElementById("audioVizualization");
primaryGainCtrol.connect(audioContext.destination); 

let currentEffect = 0;
let currentEffectLabel = ["Master Gain", "Track Gain"];
let trackGains = []; 
let currentPad = 0; 


const audios = []; 
for (let i = 0; i < 16; i++){
    audios[i] = new Audio(); 
    trackGains[i] = audioContext.createGain(); 
    const source = audioContext.createMediaElementSource(audios[i]); 
    source.connect(trackGains[i]); 
    trackGains[i].connect(primaryGainCtrol); 
}

let pointerX = null, pointerY = null, knobValue = 0; 

document.onmousemove = function(event) {
	pointerX = event.pageX;
	pointerY = event.pageY;
}

let heightRatio = 0.15;
const dpr = window.devicePixelRatio || 1;
const padding = 0;
audioVizualizationCanvas.width = audioVizualizationCanvas.offsetWidth * dpr;
// audioVizualizationCanvas.height = (audioVizualizationCanvas.offsetHeight + padding * 2) * dpr;
audioVizualizationCanvas.height = audioVizualizationCanvas.width * 0.12; 

const canvasContext = audioVizualizationCanvas.getContext("2d"); 
canvasContext.translate(0, audioVizualizationCanvas.height / 2 + padding); // Set Y = 0 to be in the middle of the audioVizualizationCanvas
canvasContext.fillStyle = "rgb(92, 92, 91)";
let samples = audioVizualizationCanvas.width - 20; 


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
                    audios[i].currentTime = 0; 
                    audios[i].play();
                    const length = (await getData(i, 0)).length; 
                    // setInterval(() => {
                    //     while (audioContext[i].currentTime < ) 
                    // }, 10)

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
    let data = audioBuffer.getChannelData(ChannelData); 
    // data = data.slice(125331); 
    return data; 
}

async function getData(pad, ChannelData){
    const rawData = await(getAudioBuffer(pad, ChannelData)); 
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
    filteredData = filteredData.map(i => i * (audioVizualizationCanvas.height * 0.8))
    console.log(filteredData.length); 
    return filteredData; 

}

function clearCanvas(){
    canvasContext.clearRect(0, -audioVizualizationCanvas.height, audioVizualizationCanvas.width, 2 * audioVizualizationCanvas.height);
    canvasContext.fillRect(0, 0, audioVizualizationCanvas.width, dpr); 
}

async function visualizeAudio(pad){
    clearCanvas(); 
    let filteredData = await(getData(pad, 0)); 
    for (let i = 0; i < samples; i++){
        canvasContext.fillRect(i, 0, 1, Math.round(filteredData[i]/2))
    }
 

    filteredData = await(getData(pad,1));
    let i = 0; 
    for (i = 0; i < samples; i++){
        canvasContext.fillRect(i, -Math.round(filteredData[i]/2), 1, Math.round(filteredData[i]/2))
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

function updateEffects(change){
    switch (currentEffect){
        case 0: 
            primaryGainCtrol.gain.value = Math.max(0, primaryGainCtrol.gain.value + change/100); 
            break; 
        case 1: 
             
            break; 

    }

}
