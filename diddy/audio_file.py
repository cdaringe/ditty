# import librosa
# import random
# import torch
# from torchaudio import transforms
# from diddy.common import asset_filename

# class AudioFile():
#   # ----------------------------
#   # Load an audio file. Return the signal as a tensor and the sample rate
#   # ----------------------------
#   @staticmethod
#   def open_filename(basename, sr=16000):
#     return librosa.load(asset_filename(basename), sr=sr)

#   @staticmethod
#   def pad_trunc(aud, max_ms):
#     sig, sr = aud
#     num_rows, sig_len = sig.shape
#     max_len = sr//1000 * max_ms

#     if (sig_len > max_len):
#       # Truncate the signal to the given length
#       sig = sig[:,:max_len]

#     elif (sig_len < max_len):
#       # Length of padding to add at the beginning and end of the signal
#       pad_begin_len = random.randint(0, max_len - sig_len)
#       pad_end_len = max_len - sig_len - pad_begin_len

#       # Pad with 0s
#       pad_begin = torch.zeros((num_rows, pad_begin_len))
#       pad_end = torch.zeros((num_rows, pad_end_len))

#       sig = torch.cat((pad_begin, sig, pad_end), 1)

#     return (sig, sr)

#   # ----------------------------
#   # Generate a Spectrogram
#   # ----------------------------
#   @staticmethod
#   def spectro_gram(aud, n_mels=64, n_fft=1024, hop_len=None):
#     sig,sr = aud
#     top_db = 80

#     # spec has shape [channel, n_mels, time], where channel is mono, stereo etc
#     spec = transforms.MelSpectrogram(sr, n_fft=n_fft, hop_length=hop_len, n_mels=n_mels)(sig)

#     # Convert to decibels
#     spec = transforms.AmplitudeToDB(top_db=top_db)(spec)
#     return (spec)
