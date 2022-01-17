console.clear(); 

const audioContext = new (window.AudioContext || window.webkitAudioContext);

const primaryGainCtrol = audioContext.createGain(); 
primaryGainCtrol.gain.setValueAtTime(1, audioContext.currentTime); 
primaryGainCtrol.connect(audioContext.destination); 

const audios = []; 

for (let i = 0; i < 16; i++){
    audios[i] = new Audio(); 
    const source = audioContext.createMediaElementSource(audios[i]); 
    source.connect(primaryGainCtrol); 
}

const masterGainInput = document.getElementById("masterGainInput"); 

updateCurrentAudio(); 
updateFile(); 
keyPress(); 

function keyPress(){
    window.addEventListener("keydown", async (event) => {

        const keys = "asdfghjklzxcvbnm";

        for (let i = 0; i < 16; i++){
            if (keys[i] == event.key){
                const file = document.getElementById("file-input"+(i+1)).files[0]; 
                if (file != null){
                    audios[i].currentTime = 0; 
                    audios[i].play();

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
            }
        }); 
        file.addEventListener("change", function(){
            updateAudioName(i-1); 
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

async function getAudioBuffer(pad){
    const file = document.getElementById("file-input"+(pad+1)); 
    const url = URL.createObjectURL(file.files[0]); 
    const response = await(fetch(url)); 
    const arrayBuffer = await(response.arrayBuffer()); 
    const audioBuffer = await(audioContext.decodeAudioData(arrayBuffer)); 
    return audioBuffer.getChannelData(0); 
}

function visualizeAudio(pad){
    const rawData = getAudioBuffer(pad); 
    const samples = 70; 
    const blockSize = Math.floor(rawData.length / samples);
    let filteredData = [];
    let max = 0; 

    for (let i = 0; i < samples; i++){
        let sum = 0; 
        for (let j = 0; j < blockSize; j++){
            sum += Math.abs(rawData[j+i*samples]); 
        }
        filteredData[i] = sum/blockSize; 
        max = Math.max(filteredData[i], max); 
    }

    const multiplyer = Math.pow(max, -1); 
    filteredData = filteredData.map(i => i * multiplyer); 


}