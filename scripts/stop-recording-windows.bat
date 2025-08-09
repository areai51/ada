@echo off

REM Windows recording stop script

setlocal enabledelayedexpansion

REM Set paths
set TMP_DIR=%TEMP%\ada-voice
set AUDIO_FILE=%TMP_DIR%\voice-input.wav

REM Check if audio file was created
if not exist "%AUDIO_FILE%" (
    echo Error: Audio file not created: %AUDIO_FILE% >&2
    exit /b 1
)

REM Check if file has content
for %%A in ("%AUDIO_FILE%") do (
    set filesize=%%~zA
    if !filesize! leq 0 (
        echo Error: Audio file is empty >&2
        exit /b 1
    )
)

REM Output the audio file path for the calling process to use
echo %AUDIO_FILE%