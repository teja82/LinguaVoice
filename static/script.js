document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const textInput = document.getElementById('textInput');
    const languageSelect = document.getElementById('languageSelect');
    const translateBtn = document.getElementById('translateBtn');
    const speakBtn = document.getElementById('speakBtn');
    const statusContainer = document.getElementById('statusContainer');
    const statusMessage = document.getElementById('statusMessage');
    const audioContainer = document.getElementById('audioContainer');
    const audioPlayer = document.getElementById('audioPlayer');

    // Function to show status message
    function showStatus(message, type = 'info') {
        statusContainer.classList.remove('d-none');
        statusMessage.textContent = message;
        statusMessage.className = `alert alert-${type}`;
        
        if (type === 'info') {
            statusMessage.classList.add('loading');
        } else {
            statusMessage.classList.remove('loading');
        }
    }

    // Function to hide status message
    function hideStatus() {
        statusContainer.classList.add('d-none');
    }

    // Function to translate text
    async function translateText() {
        const text = textInput.value.trim();
        if (!text) {
            showStatus('Please enter some text to translate! ⚠', 'warning');
            return;
        }

        showStatus('Translating... 🌍', 'info');
        
        try {
            const response = await fetch('/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    language: languageSelect.value
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                textInput.value = data.translatedText;
                showStatus(`Text translated to ${languageSelect.value} ✅`, 'success');
                
                // Hide status after 3 seconds
                setTimeout(hideStatus, 3000);
            } else {
                showStatus(data.error || 'Translation failed', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showStatus('An error occurred during translation', 'danger');
        }
    }

    // Function to convert text to speech
async function textToSpeech() {
    const text = textInput.value.trim();
    if (!text) {
        showStatus('Please enter some text to convert! ⚠', 'warning');
        return;
    }

    showStatus('Generating speech... 🎙', 'info');
    
    try {
        const response = await fetch('/speak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                language: languageSelect.value
            }),
        });

        const data = await response.json();
        
        if (response.ok) {
            // Direct URL to audio file
            const audioUrl = `/audio/${data.audioFile}`;
            
            // Set the audio source and show the player
            audioPlayer.src = audioUrl;
            audioContainer.classList.remove('d-none');
            
            // Play the audio
            audioPlayer.play();
            
            showStatus('Speech generated successfully ✅', 'success');
            
            // Hide status after 3 seconds
            setTimeout(hideStatus, 3000);
        } else {
            showStatus(data.error || 'Speech generation failed', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showStatus('An error occurred during speech generation', 'danger');
    }
}

    // Add event listeners
    translateBtn.addEventListener('click', translateText);
    speakBtn.addEventListener('click', textToSpeech);

    // Add keyboard shortcuts
    textInput.addEventListener('keydown', function(event) {
        // Ctrl+Enter to translate
        if (event.ctrlKey && event.key === 'Enter') {
            translateText();
        }
        // Alt+Enter to speak
        else if (event.altKey && event.key === 'Enter') {
            textToSpeech();
        }
    });

    // Handle audio playing events
    audioPlayer.addEventListener('ended', function() {
        showStatus('Audio playback completed ✅', 'success');
        setTimeout(hideStatus, 3000);
    });

    audioPlayer.addEventListener('error', function() {
        showStatus('Error playing audio ❌', 'danger');
    });
});