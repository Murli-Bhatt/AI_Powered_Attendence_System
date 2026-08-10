import functools
import numpy as np
import json
import tempfile
import os
import io
import subprocess
import soundfile as sf
import imageio_ffmpeg
from backend.database.config import supabase

@functools.lru_cache(maxsize=1)
def load_voice_encoder():
    """Load the VoiceEncoder model once and cache it in memory."""
    from resemblyzer import VoiceEncoder
    return VoiceEncoder()

def load_audio_as_16k_wav(audio_input):
    """
    Robustly decodes ANY audio format (WebM, Opus, Ogg, WAV, MP3) into a 16kHz mono float32 numpy array.
    """
    import librosa
    temp_path = None
    try:
        if isinstance(audio_input, (str, os.PathLike)):
            wav_path = audio_input
        else:
            if hasattr(audio_input, "read"):
                audio_bytes = audio_input.read()
            elif isinstance(audio_input, bytes):
                audio_bytes = audio_input
            else:
                return None, None

            with tempfile.NamedTemporaryFile(delete=False, suffix=".raw") as tmp:
                tmp.write(audio_bytes)
                temp_path = tmp.name
            wav_path = temp_path

        # Method 1: Standard soundfile read
        try:
            wav, sr = sf.read(wav_path)
            if wav.ndim > 1:
                wav = wav.mean(axis=1)
            if sr != 16000:
                wav = librosa.resample(wav.astype(np.float32), orig_sr=sr, target_sr=16000)
            return wav.astype(np.float32), 16000
        except Exception:
            pass

        # Method 2: FFmpeg conversion using bundled imageio-ffmpeg executable
        try:
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            cmd = [
                ffmpeg_exe, "-y", "-i", wav_path,
                "-f", "wav", "-ar", "16000", "-ac", "1", "pipe:1"
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode == 0 and res.stdout:
                wav, sr = sf.read(io.BytesIO(res.stdout))
                return wav.astype(np.float32), 16000
        except Exception:
            pass

        # Method 3: Librosa fallback
        wav, sr = librosa.load(wav_path, sr=16000)
        return wav.astype(np.float32), 16000

    except Exception as e:
        print(f"Error loading audio in voice_pipeline: {e}")
        return None, None
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

def get_voice_encoding(audio_input):
    """
    Takes audio input, performs strict silence & energy validation,
    and computes 256D Resemblyzer speaker embedding.
    """
    from resemblyzer import preprocess_wav
    
    encoder = load_voice_encoder()
    wav, sr = load_audio_as_16k_wav(audio_input)
    
    if wav is None or len(wav) == 0:
        return None

    # Check signal energy / amplitude for silence detection
    rms_energy = float(np.sqrt(np.mean(wav ** 2)))
    max_amplitude = float(np.max(np.abs(wav)))
    
    # If audio is silent background noise, reject immediately
    if rms_energy < 0.005 or max_amplitude < 0.015:
        return None
        
    try:
        # Preprocess / trim silence
        try:
            wav_preprocessed = preprocess_wav(wav, source_sr=16000)
        except Exception:
            wav_preprocessed = wav
            
        if wav_preprocessed is None or len(wav_preprocessed) == 0:
            return None
            
        # Re-check energy of preprocessed speech segment
        prep_rms = float(np.sqrt(np.mean(wav_preprocessed ** 2)))
        if prep_rms < 0.005:
            return None

        # Pad short single-word callouts (e.g. 'Present!') to at least 0.5s (8000 samples)
        if len(wav_preprocessed) < 8000:
            pad_width = 8000 - len(wav_preprocessed)
            wav_preprocessed = np.pad(wav_preprocessed, (0, pad_width), mode='constant')
            
        voice_encoding = np.array(encoder.embed_utterance(wav_preprocessed))
        return voice_encoding
    except Exception as e:
        print(f"Voice encoding calculation error: {e}")
        return None

def get_known_voices():
    """
    Fetches student voice encodings from the database.
    """
    try:
        response = supabase.table('students').select('student_id, voice_embedding').execute()
        data = response.data
    except Exception as e:
        print(f"Error fetching known voices: {e}")
        return None
        
    X = []
    y = []
    
    if data:
        for row in data:
            if row.get('voice_embedding') is not None:
                try:
                    embedding = row['voice_embedding']
                    if isinstance(embedding, str):
                        embedding = json.loads(embedding)
                        
                    X.append(np.array(embedding))
                    y.append(int(row['student_id']))
                except Exception:
                    pass
                    
    if len(X) == 0:
        return None
        
    return {"X": np.array(X), "y": y}

def recognize_multiple_voices(audio_input, threshold=0.65):
    """
    Scans an audio file using Resemblyzer and strict speaker verification matching.
    """
    encoding = get_voice_encoding(audio_input)
    if encoding is None:
        return {"success": False, "error": "No speech detected (silence). Please speak clearly into the microphone."}
        
    known_data = get_known_voices()
    if known_data is None:
        return {"success": False, "error": "Database has no registered student voice embeddings."}
        
    X = known_data["X"]
    y = known_data["y"]
    
    norm_encoding = encoding / np.linalg.norm(encoding)
    norm_X = X / np.linalg.norm(X, axis=1, keepdims=True)
    
    similarities = np.dot(norm_X, norm_encoding)
    
    detected = []
    for idx, sim in enumerate(similarities):
        if sim >= threshold:
            detected.append({"student_id": int(y[idx]), "confidence": float(sim)})
            
    if detected:
        return {"success": True, "data": detected}
    return {"success": False, "error": "Voice detected, but no matching student found in database."}

def recognize_student_voice(audio_input, threshold=0.65):
    """
    Recognizes the voice in the audio using cosine similarity with strict threshold.
    """
    encoding = get_voice_encoding(audio_input)
    if encoding is None:
        return {"success": False, "error": "No speech detected (silence). Please speak clearly into the microphone."}
        
    known_data = get_known_voices()
    if known_data is None:
        return {"success": False, "error": "Database is empty. No voices to compare against."}
        
    X = known_data["X"]
    y = known_data["y"]
    
    norm_encoding = encoding / np.linalg.norm(encoding)
    norm_X = X / np.linalg.norm(X, axis=1, keepdims=True)
    
    similarities = np.dot(norm_X, norm_encoding)
    max_sim_index = int(np.argmax(similarities))
    max_sim = float(similarities[max_sim_index])
    
    if max_sim >= threshold:
        return {"success": True, "student_id": int(y[max_sim_index]), "confidence": max_sim}
    else:
        return {"success": False, "error": f"Voice not recognized (Confidence: {max_sim:.2f}). Please try again."}

def register_student_voice_in_db(student_id: int, audio_input):
    """
    Extracts encoding from the audio and updates the student's voice_embedding in Supabase.
    """
    encoding = get_voice_encoding(audio_input)
    if encoding is None:
        return {"success": False, "error": "No speech detected (silence). Please speak clearly into the microphone."}
        
    embedding_list = encoding.tolist()
    
    try:
        response = supabase.table('students').update({
            "voice_embedding": embedding_list
        }).eq('student_id', student_id).execute()
        
        get_known_voices.cache_clear() if hasattr(get_known_voices, 'cache_clear') else None
        return {"success": True, "data": response.data}
    except Exception as e:
        return {"success": False, "error": str(e)}
