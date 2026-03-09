

## Fix: Live Transcription Not Working for VoIP Calls

### Root Cause
`VoipDialer.tsx` line 179 passes `{ micStream: null, systemStream: null, mixedStream: null }` to `onRecordingStateChange`. The `RealtimeCoachingPanel` connects dual Scribe instances but the audio piping `useEffect` (lines 594-608) checks `if (!micStream ...)` and `if (!systemStream ...)` — both are null, so no audio ever reaches Scribe.

### Fix
In `VoipDialer.tsx`, on the `accept` event (line 161), capture the user's microphone via `getUserMedia` and extract the remote audio stream from the Twilio Call object, then pass both to the parent.

**VoipDialer.tsx changes:**
1. Add a `micStreamRef` to track the captured mic stream for cleanup
2. In `call.on("accept")`: 
   - Capture mic: `navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })`
   - Get remote stream: Twilio SDK v2 exposes `call.getRemoteStream()` — use this for lead audio
   - Pass both to `onRecordingStateChange(true, { micStream, systemStream: remoteStream, mixedStream: null })`
3. On disconnect/cancel/error: stop mic stream tracks and pass nulls

### Files to modify
- `src/components/crm/VoipDialer.tsx` — capture and pass audio streams on call accept

