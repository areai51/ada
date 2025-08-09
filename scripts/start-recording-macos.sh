#!/bin/bash

# Set paths
TMP_DIR="/tmp/ada-voice"
AUDIO_FILE="${TMP_DIR}/voice-input.wav"
PID_FILE="${TMP_DIR}/record.pid"

# Ensure directories exist
mkdir -p "$TMP_DIR"

# Remove old audio file
rm -f "$AUDIO_FILE"

# Use sox for recording
if command -v sox >/dev/null 2>&1; then
    # Record in background, detached
    nohup sox -d -c 1 -r 16000 "$AUDIO_FILE" >/dev/null 2>&1 &
    echo $! > "$PID_FILE"
elif command -v rec >/dev/null 2>&1; then
    # Use rec if available
    nohup rec -c 1 -r 16000 -b 16 "$AUDIO_FILE" >/dev/null 2>&1 &
    echo $! > "$PID_FILE"
else
    # Fallback: create a placeholder file if no recording tool is found
    printf "RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00" > "$AUDIO_FILE"
fi
