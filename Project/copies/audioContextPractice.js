console.clear(); 

const audioContext = new AudioContext(); 
const buffer = audioContext.createBuffer(
    1,
    audioContext.sampleRate * 0.3,
    audioContext.sampleRate
); 


const channelData = buffer.getChannelData(0); 

for (var i = 0; i < buffer.length; i++){
    channelData[i] = Math.random() * 2 - 1; 
}

const whiteNoiseSource = audioContext.createBufferSource(); 
whiteNoiseSource.buffer = buffer; 

const primaryGainCtrol = audioContext.createGain(); 
primaryGainCtrol.gain.setValueAtTime(0.05, audioContext.currentTime); 
primaryGainCtrol.connect(audioContext.destination); 



const snareFilter = audioContext.createBiquadFilter(); 
snareFilter.type = "highpass"; 
snareFilter.frequency.value = 1500; 
snareFilter.connect(primaryGainCtrol); 


window.addEventListener("keypress", function (event){
    if (event.key == 'a'){
        const whiteNoiseSource = audioContext.createBufferSource(); 
        whiteNoiseSource.buffer = buffer; 
        whiteNoiseSource.connect(primaryGainCtrol); 
        whiteNoiseSource.start(); 
    }
    else if (event.key == 's'){
        const whiteNoiseSource = audioContext.createBufferSource(); 
        whiteNoiseSource.buffer = buffer; 
        whiteNoiseSource.connect(snareFilter); 
        whiteNoiseSource.start(); 
    }
    else if (event.key == 'd'){
        const kickGain = audioContext.createGain(); 
        kickGain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.25
        )
        const kickOscillator = audioContext.createOscillator(); 
        kickOscillator.frequency.setValueAtTime(150, audioContext.currentTime); 
        kickOscillator.frequency.exponentialRampToValueAtTime(
            0.01, 
            audioContext.currentTime + 0.25
        )
        kickOscillator.connect(kickGain); 
        kickGain.connect(primaryGainCtrol); 
        kickOscillator.start(); 
        kickOscillator.stop(audioContext.currentTime + 0.25); 
    }
    else if (event.key == 'f'){ 
        const file = document.getElementById("file-input4").files[0]; 
        const url = URL.createObjectURL(file); 
        const audio = new Audio(url); 
        audio.loop = true; 
        console.log(audio.src);
        const source = audioContext.createMediaElementSource(audio); 

        source.connect(primaryGainCtrol); 
        audio.play(); 
    }


})


//updating the names of the buttons
for (let i = 1; i <= 16; i++){
    let file = document.getElementById("file-input" + i); 
    file.addEventListener("change", function (event) {
        let a = file.files[0]; 
        let label = document.getElementById('label_' + i); 
        if (a.name.length >= 10){
            label.style.left = "2vw"; 
        }
        else{
            label.style.left = "0"; 
        }
        
        label.innerHTML = a.name; 
    }); 
}
