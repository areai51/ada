import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { spawn, execSync } from 'child_process';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

interface VoiceInputProps {
  onTranscriptionComplete: (text: string) => void;
  onCancel: () => void;
}

// Store the active recording process
let recordingProcess: ReturnType<typeof spawn> | null = null;

export default function VoiceInput({ onTranscriptionComplete, onCancel }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [status, setStatus] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    startListening();
    return () => {
      // Ensure recording stops when component unmounts
      stopListening(true);
    };
  }, []);

  const startListening = async () => {
    try {
      setIsListening(true);
      isRecordingRef.current = true;
      setStatus('Initializing voice recognition...');
      setAudioDuration(0);
      
      intervalRef.current = setInterval(() => {
        setAudioDuration(prev => prev + 1);
      }, 1000);
      
      const response = await executeRecordingCommand('record-start');
      if (response.success) {
        setStatus('Listening... speak now (Press SPACE/ENTER to stop)');
      } else {
        setStatus(`Error: ${response.error}`);
        setTimeout(() => onCancel(), 3000);
      }
    } catch (error) {
      setStatus(`Error: ${(error as Error).message}`);
      setTimeout(() => onCancel(), 3000);
    }
  };

  const stopListening = async (isUnmounting = false) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (isListening && isRecordingRef.current) {
      isRecordingRef.current = false;
      setIsProcessing(true);
      setStatus('Processing speech...');
      
      try {
        const response = await executeRecordingCommand('record-stop');
        
        if (response.success && response.audioFile) {
          if (!isUnmounting) {
            const transcript = await transcribeAudio(response.audioFile);
            onTranscriptionComplete(transcript.trim());
          }
        } else if (!isUnmounting) {
          setStatus(response.error || 'No speech detected');
          setTimeout(() => onCancel(), 3000);
        }
      } catch (error) {
        if (!isUnmounting) {
          setStatus(`Processing error: ${(error as Error).message}`);
          setTimeout(() => onCancel(), 3000);
        }
      }
    }
    
    setIsListening(false);
    setIsProcessing(false);
    if (isUnmounting) {
      onCancel();
    }
  };

  useInput((input, key) => {
    if ((key.return || input === ' ') && isListening) {
      stopListening();
    }
    if (key.escape) {
      // Ensure recording is stopped before cancelling
      stopListening(true);
    }
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan" bold>{'🎤'} </Text>
        <Text color="white">{status}</Text>
      </Box>
      {isListening && (
        <Box>
          <Text color="gray">Duration: {formatDuration(audioDuration)} (Press SPACE/ENTER to stop)</Text>
        </Box>
      )}
    </Box>
  );
}

async function executeRecordingCommand(command: 'record-start' | 'record-stop'): Promise<{success: boolean; audioFile?: string; error?: string}> {
  return new Promise((resolve) => {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const projectRoot = path.resolve(__dirname, '../../../../');
      
      let scriptPath: string;
      switch (os.platform()) {
        case 'win32':
          scriptPath = path.join(projectRoot, command === 'record-start' 
            ? 'scripts/start-recording-windows.bat'
            : 'scripts/stop-recording-windows.bat');
          break;
        case 'darwin':
          scriptPath = path.join(projectRoot, command === 'record-start' 
            ? 'scripts/start-recording-macos.sh'
            : 'scripts/stop-recording-macos.sh');
          break;
        default:
          scriptPath = path.join(projectRoot, command === 'record-start' 
            ? 'scripts/start-recording-linux.sh'
            : 'scripts/stop-recording-linux.sh');
      }
      
      if (os.platform() !== 'win32') {
        try {
          execSync(`chmod +x "${scriptPath}"`);
        } catch (e) {
          // Ignore chmod errors
        }
      }

      if (command === 'record-start') {
        if (recordingProcess) {
          recordingProcess.kill();
        }
        
        recordingProcess = spawn(`"${scriptPath}"`, {
          shell: true,
          stdio: 'pipe',
          cwd: projectRoot,
          detached: true, // Detach to allow parent to exit cleanly
        });

        recordingProcess.on('error', (err) => {
          resolve({ success: false, error: `Failed to start recording: ${err.message}` });
        });
        
        recordingProcess.on('exit', (code) => {
          if (code !== 0) {
            // Non-zero exit could be normal if killed, so don't auto-fail
          }
        });

        // Assume success if spawn doesn't throw immediately
        resolve({ success: true });

      } else if (command === 'record-stop') {
        if (recordingProcess) {
          // Kill the detached process group
          try {
            process.kill(-recordingProcess.pid!);
          } catch (e) {
            // Ignore errors if process is already dead
          }
          recordingProcess = null;
        }
        
        // The stop script handles finding the file
        const result = execSync(`"${scriptPath}"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          cwd: projectRoot,
        });
        
        const audioFile = result.trim();
        if (audioFile && fs.existsSync(audioFile)) {
          resolve({ success: true, audioFile });
        } else {
          resolve({ success: false, error: 'Audio file not found' });
        }
      }
    } catch (error: any) {
      resolve({ success: false, error: error.message || String(error) });
    }
  });
}


async function transcribeAudio(audioFilePath: string): Promise<string> {
  try {
    const { default: Groq } = await import('groq-sdk');
    
    let apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      try {
        const os = await import('os');
        const path = await import('path');
        const fs = await import('fs');
        
        const configDir = path.join(os.homedir(), '.ada');
        const configFile = path.join(configDir, 'local-settings.json');
        
        if (fs.existsSync(configFile)) {
          const configData = fs.readFileSync(configFile, 'utf8');
          const config = JSON.parse(configData);
          apiKey = config.groqApiKey || null;
        }
      } catch (e) {
        // Ignore config read errors
      }
    }
    
    if (!apiKey) {
      throw new Error('No Groq API key found. Please set GROQ_API_KEY or use /login.');
    }
    
    const groq = new Groq({ apiKey });
    
    const audioFile = fs.createReadStream(audioFilePath);
    
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      response_format: 'text'
    });
    
    fs.unlinkSync(audioFilePath);
    
    return transcription as unknown as string;
  } catch (error: any) {
    fs.unlinkSync(audioFilePath);
    
    let errorMessage = 'Unknown transcription error';
    if (error.response) {
      errorMessage = `API Error: ${error.response.status} ${error.response.data}`;
    } else if (error.request) {
      errorMessage = `Network Error: ${error.message}`;
    } else {
      errorMessage = `Error: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
}
