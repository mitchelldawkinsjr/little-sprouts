package org.littlesprouts.learning;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

/** One native speech owner for the APK. Never logs or retains a history of spoken text. */
@CapacitorPlugin(name = "SproutsSpeech")
public class SpeechPlugin extends Plugin {
  private final Handler main = new Handler(Looper.getMainLooper());
  private final List<PluginCall> preparation = new ArrayList<>();
  private final AudioAttributes attributes = new AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_MEDIA)
      .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build();
  private TextToSpeech tts;
  private boolean ready, initializing, paused, destroyed;
  private int generation, serial;
  private String readinessReason = "not-initialized";
  private Runnable initializationGuard;
  private Request active;

  private static class Request {
    final PluginCall call;
    final String id, text, utteranceId;
    final float rate;
    String engine = "native-tts";
    boolean done, started, focused;
    MediaPlayer player;
    Runnable guard;
    AudioManager.OnAudioFocusChangeListener focusListener;
    AudioFocusRequest focusRequest;
    Request(PluginCall call, String id, String text, float rate, int serial) {
      this.call = call; this.id = id; this.text = text; this.rate = rate;
      this.utteranceId = id + ":" + serial;
    }
  }

  @PluginMethod public void speak(PluginCall call) {
    main.post(() -> {
      String id = call.getString("id");
      String text = call.getString("text");
      String clip = call.getString("clipPath");
      Double rate = call.getDouble("rate", 0.88);
      if (id == null || id.isEmpty() || id.length() > 128 || text == null || text.trim().isEmpty()
          || text.length() > TextToSpeech.getMaxSpeechInputLength()) {
        call.reject("Invalid speech request"); return;
      }
      if (clip != null && !clip.matches("voice/1/[a-z]{2}_[a-z]+/[a-f0-9]{16}\\.m4a")) {
        call.reject("Invalid packaged speech path"); return;
      }
      if (active != null) finish(active, "interrupted", "replaced");
      float speed = rate == null || Double.isNaN(rate) || Double.isInfinite(rate) ? 0.88f : (float) Math.max(0.5, Math.min(1.5, rate));
      Request request = new Request(call, id, text, speed, ++serial);
      active = request;
      if (destroyed || paused) {
        finish(request, "interrupted", destroyed ? "destroyed" : "background"); return;
      }
      if (clip != null) playPackaged(request, clip);
      else speakNative(request);
    });
  }

  @PluginMethod public void stop(PluginCall call) {
    main.post(() -> {
      String id = call.getString("id");
      if (active != null && (id == null || active.id.equals(id))) finish(active, "interrupted", "stopped");
      call.resolve();
    });
  }

  @PluginMethod public void prepare(PluginCall call) {
    main.post(() -> {
      if (destroyed || paused || ready) { call.resolve(statusSnapshot()); return; }
      preparation.add(call);
      initialize();
    });
  }

  @PluginMethod public void status(PluginCall call) {
    main.post(() -> call.resolve(statusSnapshot()));
  }

  private JSObject statusSnapshot() {
    JSObject result = new JSObject();
    result.put("engine", "native");
    result.put("ready", ready && !paused && !destroyed);
    result.put("english", ready);
    result.put("offline", ready);
    result.put("reason", destroyed ? "destroyed" : paused ? "background" : ready ? null : readinessReason);
    return result;
  }

  private boolean live(Request request) { return active == request && !request.done && !paused && !destroyed; }

  private void playPackaged(Request request, String path) {
    request.engine = "native-file";
    try (AssetFileDescriptor file = getContext().getAssets().openFd("public/" + path)) {
      MediaPlayer player = new MediaPlayer();
      request.player = player;
      player.setAudioAttributes(attributes);
      player.setDataSource(file.getFileDescriptor(), file.getStartOffset(), file.getLength());
      player.setOnPreparedListener(media -> main.post(() -> {
        if (!live(request) || request.player != media) return;
        if (!focus(request)) { finish(request, "failed", "audio-focus-denied"); return; }
        try {
          media.start();
          started(request);
          guard(request, playbackLimit(request), () -> finish(request, "failed", "playback-timeout"));
        } catch (RuntimeException error) { fileFailed(request); }
      }));
      player.setOnCompletionListener(media -> main.post(() -> {
        if (live(request) && request.player == media) finish(request, "completed", null);
      }));
      player.setOnErrorListener((media, what, extra) -> {
        main.post(() -> { if (live(request) && request.player == media) fileFailed(request); });
        return true;
      });
      guard(request, 5000, () -> fileFailed(request));
      player.prepareAsync();
    } catch (Exception error) { fileFailed(request); }
  }

  private void fileFailed(Request request) {
    if (!live(request)) return;
    if (request.started) { finish(request, "failed", "packaged-playback-failed"); return; }
    releasePlayer(request);
    unfocus(request);
    if (request.guard != null) main.removeCallbacks(request.guard);
    speakNative(request);
  }

  private void speakNative(Request request) {
    if (!live(request)) return;
    request.engine = "native-tts";
    if (!ready) { initialize(); return; }
    if (!focus(request)) { finish(request, "failed", "audio-focus-denied"); return; }
    try {
      if (tts.setSpeechRate(request.rate) != TextToSpeech.SUCCESS) {
        ttsFailed(request, "speech-rate-failed"); return;
      }
      if (tts.speak(request.text, TextToSpeech.QUEUE_FLUSH, null, request.utteranceId) != TextToSpeech.SUCCESS) {
        ttsFailed(request, "speech-start-failed"); return;
      }
      guard(request, 5000, () -> ttsFailed(request, "speech-start-timeout"));
    } catch (RuntimeException error) { ttsFailed(request, "speech-engine-failed"); }
  }

  private void initialize() {
    if (initializing || ready || destroyed || paused) return;
    shutdownTts();
    initializing = true;
    readinessReason = "initializing";
    final int token = generation;
    initializationGuard = () -> {
      if (generation == token && initializing) initializationFailed("speech-init-timeout");
    };
    main.postDelayed(initializationGuard, 6000);
    try {
      tts = new TextToSpeech(getContext().getApplicationContext(), result -> main.post(() -> {
        if (generation != token || !initializing || destroyed || paused) return;
        if (result != TextToSpeech.SUCCESS || tts == null) { initializationFailed("speech-engine-unavailable"); return; }
        try {
          Set<Voice> available = tts.getVoices();
          List<Voice> voices = new ArrayList<>();
          if (available != null) for (Voice voice : available) {
            if (voice != null && voice.getLocale() != null && "en".equals(voice.getLocale().getLanguage())
                && !voice.isNetworkConnectionRequired()
                && (voice.getFeatures() == null || !voice.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED))) voices.add(voice);
          }
          Collections.sort(voices, (a, b) -> {
            int order = Integer.compare("US".equals(a.getLocale().getCountry()) ? 0 : 1,
                "US".equals(b.getLocale().getCountry()) ? 0 : 1);
            return order != 0 ? order : a.getName().compareTo(b.getName());
          });
          if (voices.isEmpty()) { initializationFailed("missing-offline-english-voice"); return; }
          Voice voice = voices.get(0);
          if (tts.isLanguageAvailable(voice.getLocale()) < TextToSpeech.LANG_AVAILABLE
              || tts.setLanguage(voice.getLocale()) < TextToSpeech.LANG_AVAILABLE
              || tts.setVoice(voice) != TextToSpeech.SUCCESS) {
            initializationFailed("missing-offline-english-voice"); return;
          }
          tts.setAudioAttributes(attributes);
          tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) { main.post(() -> {
              Request request = matching(id);
              if (request != null) {
                started(request);
                guard(request, playbackLimit(request), () -> ttsFailed(request, "playback-timeout"));
              }
            }); }
            @Override public void onDone(String id) { main.post(() -> {
              Request request = matching(id);
              if (request != null) {
                if (request.started) finish(request, "completed", null);
                else ttsFailed(request, "speech-never-started");
              }
            }); }
            @Override public void onError(String id) { error(id, "speech-engine-failed"); }
            @Override public void onError(String id, int code) {
              error(id, code == TextToSpeech.ERROR_NOT_INSTALLED_YET ? "missing-offline-english-voice" : "speech-engine-failed");
            }
            @Override public void onStop(String id, boolean interrupted) { main.post(() -> {
              Request request = matching(id);
              if (request != null) ttsFailed(request, "speech-engine-stopped");
            }); }
            private void error(String id, String reason) { main.post(() -> {
              Request request = matching(id);
              if (request != null) ttsFailed(request, reason);
            }); }
          });
          main.removeCallbacks(initializationGuard);
          initializing = false; ready = true; readinessReason = null;
          resolvePreparation();
          if (active != null && "native-tts".equals(active.engine)) speakNative(active);
        } catch (RuntimeException error) { initializationFailed("speech-engine-unavailable"); }
      }));
    } catch (RuntimeException error) { initializationFailed("speech-engine-unavailable"); }
  }

  private Request matching(String id) {
    Request request = active;
    return request != null && live(request) && "native-tts".equals(request.engine)
        && request.utteranceId.equals(id) ? request : null;
  }

  private void initializationFailed(String reason) {
    shutdownTts();
    readinessReason = reason;
    resolvePreparation();
    if (active != null && "native-tts".equals(active.engine)) finish(active, "failed", reason);
  }

  private void ttsFailed(Request request, String reason) {
    if (!live(request)) return;
    finish(request, "failed", reason);
    shutdownTts();
    readinessReason = reason;
  }

  private void resolvePreparation() {
    JSObject result = statusSnapshot();
    for (PluginCall call : preparation) call.resolve(result);
    preparation.clear();
  }

  private void started(Request request) {
    if (!live(request) || request.started) return;
    request.started = true;
    JSObject event = new JSObject(); event.put("id", request.id); event.put("engine", request.engine);
    notifyListeners("speechStart", event);
  }

  private long playbackLimit(Request request) { return Math.min(180000L, Math.max(15000L, 5000L + request.text.length() * 180L)); }

  private void guard(Request request, long duration, Runnable action) {
    if (request.guard != null) main.removeCallbacks(request.guard);
    request.guard = () -> { if (live(request)) action.run(); };
    main.postDelayed(request.guard, duration);
  }

  private AudioManager audio() { return (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE); }

  @SuppressWarnings("deprecation")
  private boolean focus(Request request) {
    if (request.focused) return true;
    AudioManager audio = audio();
    if (audio == null) return false;
    request.focusListener = change -> {
      if (change < 0) main.post(() -> { if (live(request)) finish(request, "interrupted", "audio-focus-lost"); });
    };
    int result;
    try {
      if (Build.VERSION.SDK_INT >= 26) {
        request.focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
            .setAudioAttributes(attributes).setOnAudioFocusChangeListener(request.focusListener, main)
            .setAcceptsDelayedFocusGain(false).build();
        result = audio.requestAudioFocus(request.focusRequest);
      } else result = audio.requestAudioFocus(request.focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
    } catch (RuntimeException error) { return false; }
    request.focused = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    return request.focused;
  }

  @SuppressWarnings("deprecation")
  private void unfocus(Request request) {
    if (!request.focused) return;
    request.focused = false;
    try {
      AudioManager audio = audio();
      if (audio != null) {
        if (Build.VERSION.SDK_INT >= 26 && request.focusRequest != null) audio.abandonAudioFocusRequest(request.focusRequest);
        else audio.abandonAudioFocus(request.focusListener);
      }
    } catch (RuntimeException ignored) { /* Audio service already gone. */ }
  }

  private void releasePlayer(Request request) {
    if (request.player == null) return;
    MediaPlayer player = request.player; request.player = null;
    try { player.release(); } catch (RuntimeException ignored) { /* Player already gone. */ }
  }

  private void finish(Request request, String status, String reason) {
    if (request.done || active != request) return;
    request.done = true;
    active = null;
    if (request.guard != null) main.removeCallbacks(request.guard);
    releasePlayer(request);
    if (tts != null && "native-tts".equals(request.engine)) {
      try { tts.stop(); } catch (RuntimeException ignored) { /* Engine may already be dead. */ }
    }
    unfocus(request);
    JSObject result = new JSObject(); result.put("status", status); result.put("engine", request.engine);
    if (reason != null) result.put("reason", reason);
    request.call.resolve(result);
  }

  private void shutdownTts() {
    generation++;
    ready = false; initializing = false;
    if (initializationGuard != null) main.removeCallbacks(initializationGuard);
    if (tts != null) {
      TextToSpeech old = tts; tts = null;
      try { old.stop(); old.shutdown(); } catch (RuntimeException ignored) { /* Dead service. */ }
    }
  }

  @Override protected void handleOnPause() { main.post(() -> {
    paused = true;
    if (active != null) finish(active, "interrupted", "background");
    shutdownTts(); readinessReason = "background";
    resolvePreparation();
  }); }

  @Override protected void handleOnResume() { main.post(() -> {
    paused = false;
    if (!ready) readinessReason = "not-initialized";
    notifyListeners("speechResume", new JSObject());
  }); }

  @Override protected void handleOnDestroy() { main.post(() -> {
    destroyed = true;
    if (active != null) finish(active, "interrupted", "destroyed");
    shutdownTts(); readinessReason = "destroyed";
    resolvePreparation();
  }); }
}
