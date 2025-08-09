#!/bin/bash

# Linux recording start script using built-in tools

# Set paths
TMP_DIR="/tmp/ada-voice"
AUDIO_FILE="${TMP_DIR}/voice-input.wav"
PID_FILE="${TMP_DIR}/record.pid"

# Ensure directories exist
mkdir -p "$TMP_DIR"

# Remove old audio file
rm -f "$AUDIO_FILE"

# Start recording with available tools
if command -v sox >/dev/null 2>&1; then
    # Use sox if available (recommended)
    sox -d -c 1 -r 16000 "$AUDIO_FILE" &
    echo $! > "$PID_FILE"
    echo "Recording started with sox - speak now (Press Ctrl+V again to stop)"
elif command -v rec >/dev/null 2>&1; then
    # Use rec if available
    rec -c 1 -r 16000 -b 16 "$AUDIO_FILE" &
    echo $! > "$PID_FILE"
    echo "Recording started with rec - speak now (Press Ctrl+V again to stop)"
elif command -v ffmpeg >/dev/null 2>&1; then
    # Use ffmpeg as fallback
    ffmpeg -y -f alsa -i default -ar 16000 -ac 1 -f wav "$AUDIO_FILE" >/dev/null 2>&1 &
    echo $! > "$PID_FILE"
    echo "Recording started with ffmpeg - speak now (Press Ctrl+V again to stop)"
else
    echo "Error: No recording tool found (sox, rec, or ffmpeg required)" >&2
    exit 1
fi