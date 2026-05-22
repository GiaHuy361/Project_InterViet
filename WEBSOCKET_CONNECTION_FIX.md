# WebSocket Connection Issue - Diagnosis & Fix

## Problem Summary
The WebSocket connection is being established but then **immediately closed** in the voice interview realtime session. The log shows:
- WebSocket connects successfully
- But connection closes right after without completing the setup

```
connection open
connection_lost  <- immediately after
```

## Root Cause Analysis

### Issue 1: GeminiLiveClient - Missing Setup Verification
**Problem:** The old implementation was resolving the `connect()` promise on `onopen`, but the actual setup is not complete until the server sends a `setupComplete` message. If the server closes the connection before sending this message, the connection is lost.

**Old Behavior:**
```typescript
ws.onopen = () => {
  clearTimeout(timeout);
  // Immediately resolve promise - setupComplete not verified
  resolve();
};
```

### Issue 2: No Timeout for Setup Completion
The connection had no wait mechanism for the `setupComplete` message from the server, so any delays or server issues would cause the connection to drop.

### Issue 3: Insufficient Error Logging
Both WebRTC clients lacked detailed logging to help diagnose what happened during connection establishment.

## Fixes Applied

### Fix 1: Enhanced GeminiLiveClient Connection Flow ✅

**What Changed:**
- Connection promise now waits for `setupComplete` message from server (30 second timeout)
- Only resolves after receiving server confirmation
- Prevents connection drops before setup is verified
- Added `hasReceivedSetup` flag to track setup state

**Key code:**
```typescript
private setupCompleteResolve: (() => void) | null = null;
private hasReceivedSetup: boolean = false;

// In connect():
this.setupCompleteResolve = () => {
  console.log('[GeminiLiveClient] Setup completed, resolving connection promise');
  clearTimeout(connectionTimeout);
  if (this.callbacks.onConnectionStateChange) {
    this.callbacks.onConnectionStateChange('connected');
  }
  resolve();
};

// In handleServerMessage():
if (message.setupComplete || message.setup_complete) {
  this.hasReceivedSetup = true;
  if (this.setupCompleteResolve) {
    this.setupCompleteResolve();
    this.setupCompleteResolve = null;
  }
}
```

### Fix 2: Better Error Handling ✅
- Connection now closes with proper error message if setup timeout occurs
- Server close before setup is properly detected
- Cleaner error messages for debugging

### Fix 3: Enhanced Logging ✅

**GeminiLiveClient logs:**
- `[GeminiLiveClient] WebSocket connection established, waiting for setupComplete from server...`
- `[GeminiLiveClient] Setup completed successfully`
- `[GeminiLiveClient] Setup timeout - server did not send setupComplete within 30 seconds`

**OpenAiWebRtcClient logs:**
- `[OpenAiWebRtcClient] WebSocket connected for SDP exchange`
- `[OpenAiWebRtcClient] SDP offer sent successfully`
- `[OpenAiWebRtcClient] Received SDP answer from server`
- `[OpenAiWebRtcClient] WebSocket error during SDP exchange`

## What to Check on Backend

The frontend is now ready to receive the complete handshake. Please verify:

### 1. **Gemini Backend (for Gemini provider)**
- [ ] Server sends `setupComplete` or `setup_complete` message immediately after WebSocket connection
- [ ] Does NOT close connection while client is waiting
- [ ] Sends proper JSON format:
  ```json
  {
    "setupComplete": true
  }
  ```

### 2. **OpenAI Backend (for OpenAI provider)**
- [ ] WebRTC negotiation completes successfully
- [ ] SDP answer is sent within 20 seconds
- [ ] Data channel opens and sends initial session setup

### 3. **Connection Validation**
- [ ] Check if clientSecret is being validated correctly
- [ ] Verify clientSecret hasn't expired or been invalidated
- [ ] Check if there are any authentication errors being silently ignored

### 4. **Server-Side Debugging**
Look for these scenarios:
- Is the server closing the WebSocket immediately due to:
  - Invalid clientSecret?
  - Expired token?
  - Missing required message format?
  - Auth headers not being read from query params vs HTTP headers?

## Testing the Fix

1. **Monitor Browser Console:**
   ```
   [GeminiLiveClient] WebSocket connection established, waiting for setupComplete from server...
   [GeminiLiveClient] Setup completed successfully
   ```

2. **Check Network Tab:**
   - WebSocket should stay open
   - Should see message exchanges (frames) between client and server

3. **Check Error Messages:**
   If connection still fails:
   - Look for `Setup timeout - server did not send setupComplete within 30 seconds`
   - Or `WebSocket closed before receiving setupComplete`
   - These indicate backend issue, not client issue

## Files Modified

1. `src/lib/realtime/geminiLiveClient.ts`
   - Added setup completion verification
   - Enhanced error handling
   - Better logging

2. `src/lib/realtime/openAiWebRtcClient.ts`
   - Added connection step logging
   - Better error context

## Next Steps

1. **Run the application** and attempt to start a voice interview
2. **Open browser DevTools Console** and look for the new log messages
3. **Share the complete console logs** if the issue persists
4. **Check backend logs** for any rejection reasons

## Potential Server-Side Issues to Investigate

If the connection still closes immediately, the server might be:

```
Client Connects → [Server receives connection]
                     ↓
              [Server validates clientSecret]
                     ↓
              [Is it valid?]
                   /    \
               NO /      \ YES
                 /        \
          [Close WS]   [Send setupComplete]
                         → [Client receives setup]
                         → [Connection succeeds]
```

If you're getting immediate closure, the server is likely at the "NO" branch and closing without sending a proper error message.

## Recommended Backend Checks

```python
# Pseudo-code for Gemini backend
@ws.route('/ai/interviews/realtime/session')
def handle_connection(ws, client_secret):
    # 1. Validate clientSecret
    if not validate_secret(client_secret):
        ws.close(code=1008, reason="Invalid clientSecret")  # Close with proper code
        return
    
    # 2. Initialize Gemini connection
    setup_result = initialize_gemini()
    if not setup_result.success:
        ws.close(code=1011, reason="Backend initialization failed")
        return
    
    # 3. Send setupComplete BEFORE any other messages
    ws.send(json.dumps({
        "setupComplete": True  # OR "setup_complete": True
    }))
    
    # 4. Now handle incoming messages...
```

## Summary

The frontend now properly waits for server confirmation before considering the connection established. If the connection still closes, it's a backend issue where the server needs to:
1. Complete its setup/validation
2. Send the setupComplete message
3. Keep the connection open for bidirectional communication

The enhanced logging will help identify exactly where in this flow the problem occurs.

