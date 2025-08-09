# Voice Input Setup

To use voice input functionality, you need to have a Groq API key for speech-to-text conversion.

## Prerequisites

1. **Groq API Key**: Get your API key from the [Groq Console](https://console.groq.com/keys)

2. **System Audio Recording Tools**: 
   - **macOS**: `sox` (install with `brew install sox`)
   - **Linux**: `sox` or `alsa-utils` (install with `sudo apt-get install sox` or `sudo apt-get install alsa-utils`)
   - **Windows**: PowerShell with .NET System.Speech (included by default)

## Configuration

You can configure your Groq API key in two ways:

1. **Environment Variable**:
   ```bash
   export GROQ_API_KEY=your_api_key_here
   ```
   Or set it in your shell profile (`.bashrc`, `.zshrc`, etc.) for persistent access.

2. **ADA Login Command** (Recommended):
   Start ADA and use the `/login` command to save your API key to the `.ada` folder in your home directory. This key will be automatically used for voice input as well.

## Usage

Once configured, you can use voice input in ADA by:

1. Pressing `Ctrl+V` in the chat interface to activate voice input
2. Speaking your message when you see "Listening... speak now"
3. Pressing `SPACE` or `ENTER` to stop recording and process your speech
4. The transcribed text will be automatically sent as your message

## How It Works

The voice input feature works by:

1. Recording your voice using system audio tools
2. Sending the recorded audio to Groq's speech-to-text API
3. Using the `whisper-large-v3-turbo` model for fast transcription
4. Automatically sending the transcribed text as your message

## Troubleshooting

If you encounter issues:

1. Ensure all recording scripts are executable:
   ```bash
   chmod +x scripts/*.sh
   ```

2. Test the recording scripts manually:
   ```bash
   ./scripts/start-recording-macos.sh
   # Speak into your microphone
   ./scripts/stop-recording-macos.sh
   ```

3. Verify your Groq API key is set:
   ```bash
   echo $GROQ_API_KEY
   ```

4. Check that your system has the required recording tools:
   - macOS: `sox` or built-in audio recording tools
   - Linux: `sox`, `alsa-utils`, or `ffmpeg`
   - Windows: PowerShell with .NET System.Speech