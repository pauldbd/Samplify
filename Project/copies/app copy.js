console.clear(); 

const audioContext = new (window.AudioContext || window.webkitAudioContext);

const primaryGainCtrol = audioContext.createGain(); 
primaryGainCtrol.gain.setValueAtTime(1, audioContext.currentTime); 
primaryGainCtrol.connect(audioContext.destination); 

const audios = []; 
let currentPad = -1; 
let timeRange = new Array(16); 
let duration = new Array(16); 
let playedThrough = new Array(16)
for (var i = 0; i < 16; i++){
    timeRange[i] = new Array(2); 
    timeRange[i][0] = 0; 
    timeRange[i][1] = 100; 
    playedThrough[i] = false; 
}

for (let i = 0; i < 16; i++){
    audios[i] = new Audio(); 
    const source = audioContext.createMediaElementSource(audios[i]); 
    source.connect(primaryGainCtrol); 
}



// updateGain(); 
changeSubject(); 
updateFile(); 
updateRange(); 
keyPress(); 

//returns true if there's file, false if there isn't
function updateAudioName(pad){
    currentPad = pad; 
    const audioName = document.getElementById("audioLabel"); 
    const file = document.getElementById("file-input" + (pad)); 
    var name=null; 

    if (file.files.length == 0){
        name = "Untitled"; 
        audioName.innerHTML = "- Pad " + (pad) + ": " + name + " -"; 
        return false; 
    }
    else{
        name = file.files[0].name; 
        audioName.innerHTML = "- Pad " + (pad) + ": " + name + " -"; 
        return true; 
    }
}


function updateRange(){
    const start = document.getElementById("audioStart"); 
    const end = document.getElementById("audioEnd"); 

    if (currentPad >= 0){
        start.value = timeRange[currentPad][0]; 
        end.value = timeRange[currentPad][1]; 
    }

    start.addEventListener("input", function (event){
        if (currentPad >= 0)
        timeRange[currentPad-1][0] = start.value; 
        const label = document.getElementById("audioStartLabel"); 
        label.innerHTML = "Start: " + parseFloat(start.value).toFixed(2) + " sec."; 
    })
    end.addEventListener("input", function (event){
        if (currentPad >= 0)
        timeRange[currentPad-1][1] = end.value; 
        const label = document.getElementById("audioEndLabel"); 
        label.innerHTML = "End: " + parseFloat(end.value).toFixed(2) + " sec.";
    })

}

function keyPress(){
    window.addEventListener("keydown", async (event) => {

        const keys = "asdfghjklzxcvbnm";

        for (let i = 0; i < 16; i++){
            if (keys[i] == event.key){
                const key = document.getElementById("pad-"+(i+1)); 
                const file = document.getElementById("file-input"+(i+1)).files[0]; 
                if (file != null){
                    const audio = audios[i];
                    audio.currentTime = timeRange[i][0]; 
                    if (timeRange[i][0] < timeRange[i][1]){
                        audio.play(); 
                        setInterval(function(){
                            if(audio.currentTime>timeRange[i][1]){
                                audio.pause();
                                audio.currentTime = 0; 
                                    }
                                },10);
                    }
                    
                }

            }
        }
    })
}

function updateFile(){
    for (let i = 1; i <= 16; i++){
        let file = document.getElementById("file-input" + i); 
        file.addEventListener("input", function (event) {
            if (updateAudioName(i)){
                audios[i-1].src = URL.createObjectURL(file.files[0]); 
            }
            playedThrough[i-1] = false; 
        }); 
        let audio = audios[i-1]; 
        audio.addEventListener("canplaythrough", function (event){
            if (!playedThrough[i-1]){
                timeRange[i-1][1] = audio.duration; 
                timeRange[i-1][0] = 0; 
                duration[i-1] = audio.duration; 
    
                const start = document.getElementById("audioStart"); 
                const end = document.getElementById("audioEnd"); 
                const endLabel = document.getElementById("audioEndLabel"); 
    
                start.max = audio.duration; 
                end.max = audio.duration; 
    
                start.value = 0; 
                end.value = end.max; 
                endLabel.innerHTML = "End: " + end.value + " sec."; 
                
                
                playedThrough[i-1] = true; 
                // currentPad = i-1; 
            }
        })
    }
}

function changeSubject(){
    for (let i = 1; i <= 16; i++){
        const key = document.getElementById("pad-"+i); 
        key.addEventListener("contextmenu", function (event) {
            event.preventDefault()
            if (event.button == 2){
                updateAudioName(i); 
                const start = document.getElementById("audioStart"); 
                const end = document.getElementById("audioEnd"); 
                start.max = duration[i-1]; 
                end.max = duration[i-1]; 
                // currentPad = i-1; 
            }
        }); 
    }

}

audioContext.close(); 