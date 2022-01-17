console.clear(); 



window.addEventListener('keydown', function (event){
    let keys = "asdfghjklzxcvbnm"; 

    for (var i = 1; i <= 16; i++){

        if (event.key == keys[i-1]){
            let file = document.getElementById("file-input" + i).files[0]; 
            if (file == null) continue;  

            let url = URL.createObjectURL(file); 
            let player = new Tone.Player(url, () => {
                player.volume.value = 0; 
                player.start(Tone.context.currentTime); 
                window.addEventListener('keydown', function (e){
                    if (e.key == " "){
                        player.stop(Tone.context.currentTime); 
                    }
                })

            }); 
            player.toDestination(); const audioContext = new AudioContext();
            const element = document.querySelector(audio);
            const source = audioContext.createMediaElementSource(element);
            source.connect(audioContext.destination)
            audio.play();
        }
    }



}); 

for (let i = 1; i <= 16; i++){
    let file = document.getElementById("file-input" + i); 
    file.addEventListener("change", function (event) {
        let a = file.files[0]; 
        let label = document.getElementById('label ' + i); 
        if (a.name.length >= 10){
            label.style.left = "2vw"; 
        }
        else{
            label.style.left = "0"; 
        }
        
        label.innerHTML = a.name; 
    }); 
}
