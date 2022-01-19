console.clear(); 

const audioContext = new (window.AudioContext || window.webkitAudioContext);
const primaryGainCtrol = audioContext.createGain(); 
const audioVizualizationCanvas = document.getElementById("audioVizualization");
primaryGainCtrol.connect(audioContext.destination); 


const audios = []; 
for (let i = 0; i < 16; i++){
    audios[i] = new Audio(); 
    const source = audioContext.createMediaElementSource(audios[i]); 
    source.connect(primaryGainCtrol); 
} 

let heightRatio = 0.15;
const dpr = window.devicePixelRatio || 1;
const padding = 0;
audioVizualizationCanvas.width = audioVizualizationCanvas.offsetWidth * dpr;
// audioVizualizationCanvas.height = (audioVizualizationCanvas.offsetHeight + padding * 2) * dpr;
audioVizualizationCanvas.height = audioVizualizationCanvas.width * 0.12; 

const canvasContext = audioVizualizationCanvas.getContext("2d"); 
canvasContext.scale(dpr, dpr);
canvasContext.translate(0, audioVizualizationCanvas.offsetHeight / 2 + padding); // Set Y = 0 to be in the middle of the audioVizualizationCanvas
canvasContext.fillStyle = "rgb(92, 92, 91)";
let samples = audioVizualizationCanvas.width; 

updateCurrentAudio(); 
updateFile(); 
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
                    // const length = (await getData(i, 0)).length; 
                    // setInterval(() => {
                    //     while (audioContext[i].currentTime < ) 
                    // }, 10)

                }

            }
        }
    })
}

function updateFile(){
    for (let i = 0; i < 16; i++){
        const file = document.getElementById("file-input"+(i+1)); 
        file.addEventListener("input", function (event){
            audios[i].src = URL.createObjectURL(file.files[0]); 
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
        audioLabel.innerHTML = "Pad " + (pad+1) + ": Untitled"; 
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
    const blockSize = Math.floor(rawData.length / samples);
    let filteredData = [];
    let max = 0; 

    for (let i = 0; i < samples; i++){
        let sum = 0; 
        for (let j = 0; j < blockSize; j++){
            if (!isNaN(Math.abs(rawData[j+i*samples])))
            sum += Math.abs(rawData[j+i*samples]); 
        }
        filteredData.push(sum/blockSize)
        max = Math.max(max, filteredData[i]); 
    }

    const multiplyer = Math.pow(max, -1); 
    filteredData = filteredData.map(i => i * multiplyer); 
    filteredData = filteredData.map(i => i * (audioVizualizationCanvas.height * 0.5))
    return filteredData; 

}

function clearCanvas(){
    canvasContext.clearRect(0, -audioVizualizationCanvas.height, audioVizualizationCanvas.width, 2 * audioVizualizationCanvas.height);
}

async function visualizeAudio(pad){
    clearCanvas(); 
    let filteredData = await(getData(pad, 0)); 

    canvasContext.fillRect(0, 0, audioVizualizationCanvas.width, 1); 
    for (let i = 0; i < filteredData.length; i++){
        canvasContext.fillRect(i, 0, 1, Math.round(filteredData[i]/2))
    }

    filteredData = await(getData(pad,1));
    let i = 0; 
    for (i = 0; i < filteredData.length; i++){
        canvasContext.fillRect(i, -Math.round(filteredData[i]/2), 1, Math.round(filteredData[i]/2))
    }
    console.log(i); 
    // canvasContext.fillStyle = "red"; 
    // canvasContext.fillRect(i-1, 0, 1, 50); 
}

