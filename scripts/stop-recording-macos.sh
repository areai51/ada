#!/bin/bash

# Stop recording and return audio file path for Groq processing

# Set paths
TMP_DIR="/tmp/ada-voice"
AUDIO_FILE="${TMP_DIR}/voice-input.wav"
PID_FILE="${TMP_DIR}/record.pid"

# Stop recording if process is running
if [[ -f "$PID_FILE" ]]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        wait "$PID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
fi

# Check if audio file was created
if [[ ! -f "$AUDIO_FILE" ]]; then
    echo "Error: Audio file not created: $AUDIO_FILE" >&2
    exit 1
fi

# Check if file has content
if [[ ! -s "$AUDIO_FILE" ]]; then
    echo "Error: Audio file is empty" >&2
    rm -f "$AUDIO_FILE"
    exit 1
fi

# Output the audio file path for the calling process to use
echo "$AUDIO_FILE"