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
        key.addEventListener("contextmenu", function (event) {
            event.preventDefault()
            if (event.button == 2){
                updateAudioName(i-1); 
            }
        }); 
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