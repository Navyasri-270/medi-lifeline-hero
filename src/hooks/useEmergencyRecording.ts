import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
}

export interface EmergencyRecording {
  id: string;
  recording_url: string;
  duration_seconds: number;
  created_at: string;
}

export function useEmergencyRecording(sosLogId?: string) {
  const { user } = useAuth();
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    error: null,
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      // Create MediaRecorder with best available format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setState(prev => ({ ...prev, audioBlob, isRecording: false }));
      };
      
      mediaRecorder.onerror = () => {
        setState(prev => ({ 
          ...prev, 
          error: "Recording failed. Please try again.",
          isRecording: false 
        }));
      };
      
      // Start recording with 1-second chunks for reliability
      mediaRecorder.start(1000);
      
      // Start duration timer
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setState(prev => ({ 
          ...prev, 
          duration: Math.floor((Date.now() - startTime) / 1000) 
        }));
      }, 1000);
      
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false,
        duration: 0 
      }));
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Microphone access denied";
      setState(prev => ({ 
        ...prev, 
        error: message.includes("Permission") 
          ? "Microphone permission denied. Please allow access."
          : message,
        isRecording: false 
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [state.isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      
      const currentDuration = state.duration;
      const resumeTime = Date.now();
      
      timerRef.current = window.setInterval(() => {
        setState(prev => ({ 
          ...prev, 
          duration: currentDuration + Math.floor((Date.now() - resumeTime) / 1000) 
        }));
      }, 1000);
      
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused, state.duration]);

  const saveRecording = useCallback(async (): Promise<EmergencyRecording | null> => {
    if (!state.audioBlob || !user) {
      setState(prev => ({ ...prev, error: "No recording to save or not authenticated" }));
      return null;
    }

    try {
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `sos-recording-${user.id}-${timestamp}.webm`;
      
      // Upload to Supabase storage (using health-reports bucket for now)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('health-reports')
        .upload(`recordings/${fileName}`, state.audioBlob, {
          contentType: state.audioBlob.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Store only the file path (not full URL) for security
      // Signed URLs will be generated on-demand when accessing recordings
      const recordingPath = `recordings/${fileName}`;

      // Save metadata to database with file path only
      const { data: recordingData, error: dbError } = await supabase
        .from('sos_recordings')
        .insert({
          user_id: user.id,
          sos_log_id: sosLogId || null,
          recording_url: recordingPath, // Store path only, not full URL
          duration_seconds: state.duration,
          file_size_bytes: state.audioBlob.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Clear the blob after successful save
      setState(prev => ({ ...prev, audioBlob: null, duration: 0 }));

      return recordingData as EmergencyRecording;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save recording";
      setState(prev => ({ ...prev, error: message }));
      return null;
    }
  }, [state.audioBlob, state.duration, user, sosLogId]);

  const discardRecording = useCallback(() => {
    audioChunksRef.current = [];
    setState(prev => ({ 
      ...prev, 
      audioBlob: null, 
      duration: 0,
      error: null 
    }));
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...state,
    formattedDuration: formatDuration(state.duration),
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    saveRecording,
    discardRecording,
    isSupported: typeof MediaRecorder !== 'undefined',
  };
}
