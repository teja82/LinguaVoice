import os
import logging
import tempfile
from flask import Flask, render_template, request, jsonify, send_file, after_this_request
from deep_translator import GoogleTranslator
from gtts import gTTS
import uuid

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Create a directory for temporary audio files
temp_dir = os.path.join(tempfile.gettempdir(), "text_to_speech_app")
os.makedirs(temp_dir, exist_ok=True)

# Supported languages for translation and speech
LANGUAGES = {
    "English": "en",
    "French": "fr",
    "Spanish": "es",
    "German": "de",
    "Hindi": "hi",
    "Chinese": "zh-cn",
    "Japanese": "ja",
    "Telugu": "te",
    "Bengali": "bn",
    "Tamil": "ta"
}

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html', languages=LANGUAGES)

@app.route('/translate', methods=['POST'])
def translate():
    """API endpoint to translate text."""
    try:
        data = request.json
        text = data.get('text', '')
        target_lang = LANGUAGES[data.get('language', 'English')]
        
        if not text:
            return jsonify({'error': 'Please enter some text to translate!'}), 400
        
        translated_text = GoogleTranslator(source="auto", target=target_lang).translate(text)
        return jsonify({'translatedText': translated_text})
    except Exception as e:
        logging.error(f"Translation error: {str(e)}")
        return jsonify({'error': f'Translation failed: {str(e)}'}), 500

@app.route('/speak', methods=['POST'])
def speak():
    """API endpoint to convert text to speech."""
    try:
        data = request.json
        text = data.get('text', '')
        target_lang = LANGUAGES[data.get('language', 'English')]
        
        if not text:
            return jsonify({'error': 'Please enter some text to convert to speech!'}), 400
        
        # Generate a unique filename
        filename = f"speech_{uuid.uuid4().hex}.mp3"
        file_path = os.path.join(temp_dir, filename)
        
        # Convert text to speech using gTTS
        tts = gTTS(text=text, lang=target_lang, slow=False)
        tts.save(file_path)
        
        # Return the audio filename (not the full path)
        return jsonify({'audioFile': filename})
    except Exception as e:
        logging.error(f"Text-to-speech error: {str(e)}")
        return jsonify({'error': f'Text-to-speech conversion failed: {str(e)}'}), 500

@app.route('/audio/<filename>')
def get_audio(filename):
    """Serve the audio file."""
    try:
        file_path = os.path.join(temp_dir, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Audio file not found'}), 404
        
        @after_this_request
        def remove_file(response):
            try:
                # Clean up the file after sending
                os.remove(file_path)
                logging.debug(f"Deleted temporary file: {file_path}")
            except Exception as e:
                logging.error(f"Error removing temporary file: {str(e)}")
            return response
        
        return send_file(file_path, mimetype='audio/mpeg')
    except Exception as e:
        logging.error(f"Audio serving error: {str(e)}")
        return jsonify({'error': f'Could not serve audio file: {str(e)}'}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)