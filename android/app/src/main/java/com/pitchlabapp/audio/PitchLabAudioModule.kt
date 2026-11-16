package com.pitchlabapp.audio

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class PitchLabAudioModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val mainHandler = Handler(Looper.getMainLooper())
    private var engine: AudioEngine? = null
    private var sessionId: Long = 0

    override fun getName(): String = "PitchLabAudio"

    @ReactMethod
    fun addListener(eventName: String) {
        // Required by NativeEventEmitter consumers; readings use the device emitter.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // No native subscription list is retained.
    }

    @ReactMethod
    fun start(config: ReadableMap, promise: Promise) {
        mainHandler.post {
            try {
                val requestedSession = if (config.hasKey("sessionId")) config.getDouble("sessionId").toLong() else 0L
                sessionId = requestedSession
                engine?.stop()
                engine = null

                val sampleRate = config.getInt("sampleRate")
                val analysisRate = config.getInt("analysisRate")
                val debugMask = if (config.hasKey("debugMask")) config.getInt("debugMask") else 0
                if (debugMask and 1 != 0) {
                    emitStatus("disabled", "Audio input is disabled in Debugging options.")
                    val result = Arguments.createMap()
                    result.putBoolean("started", false)
                    result.putInt("sampleRate", sampleRate)
                    promise.resolve(result)
                    return@post
                }

                if (
                    ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO) !=
                    PackageManager.PERMISSION_GRANTED
                ) {
                    promise.reject("PERMISSION_DENIED", "Microphone permission has not been granted.")
                    return@post
                }

                val temperament = if (config.hasKey("temperamentCents")) {
                    val array = config.getArray("temperamentCents")
                    DoubleArray(array?.size() ?: 0) { index -> array?.getDouble(index) ?: 0.0 }
                } else {
                    DoubleArray(0)
                }
                val notes = if (config.hasKey("instrumentNotes")) {
                    val array = config.getArray("instrumentNotes")
                    IntArray(array?.size() ?: 0) { index -> array?.getInt(index) ?: 0 }
                } else {
                    IntArray(0)
                }
                val engineConfig = AudioEngineConfig(
                    sampleRate = sampleRate,
                    analysisRate = analysisRate,
                    a4Reference = config.getDouble("a4Reference"),
                    temperamentCents = temperament,
                    instrumentNotes = notes,
                    inTuneThreshold = config.getDouble("inTuneThreshold"),
                    audioSetupVersion = if (config.hasKey("audioSetupVersion")) config.getString("audioSetupVersion") ?: "Latest" else "Latest",
                    audioAnalysisVersion = if (config.hasKey("audioAnalysisVersion")) config.getString("audioAnalysisVersion") ?: "Latest" else "Latest",
                    debugMask = debugMask,
                    sessionId = sessionId,
                )

                try {
                    val manager = reactContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
                    manager?.isMicrophoneMute = false
                } catch (_: Throwable) {
                }

                val nextEngine = AudioEngine(
                    context = reactContext,
                    config = engineConfig,
                    onReading = { reading -> dispatchReading(reading) },
                    onError = { code, message -> dispatchRuntimeError(code, message) },
                )
                engine = nextEngine
                try {
                    nextEngine.start()
                } catch (caught: Throwable) {
                    engine = null
                    nextEngine.stop()
                    promise.reject(
                        "AUDIO_SETUP_FAILED",
                        caught.message ?: "The microphone could not be started at $sampleRate Hz.",
                    )
                    return@post
                }

                emitStatus("running", null, sampleRate, analysisRate)
                val result = Arguments.createMap()
                result.putBoolean("started", true)
                result.putInt("sampleRate", sampleRate)
                promise.resolve(result)
            } catch (caught: Throwable) {
                promise.reject("AUDIO_START_FAILED", caught.message ?: "Audio engine failed to start.", caught)
            }
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        mainHandler.post {
            engine?.stop()
            engine = null
            emitStatus("stopped")
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun isMicrophoneAvailable(promise: Promise) {
        val available = reactContext.packageManager.hasSystemFeature(PackageManager.FEATURE_MICROPHONE)
        promise.resolve(available)
    }

    @ReactMethod
    fun getCapabilities(promise: Promise) {
        val result = Arguments.createMap()
        result.putInt("minSampleRate", 8000)
        result.putInt("maxSampleRate", 48000)
        result.putString("nativeVersion", "1.0.0")
        promise.resolve(result)
    }

    @ReactMethod
    fun setOrientation(mode: Int) {
        mainHandler.post {
            val activity = reactContext.currentActivity ?: return@post
            activity.requestedOrientation = when (mode) {
                1 -> android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
                2 -> android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
                else -> android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR
            }
        }
    }

    @ReactMethod
    fun setKeepScreenOn(enabled: Boolean) {
        mainHandler.post {
            val activity = reactContext.currentActivity ?: return@post
            if (enabled) {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            } else {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    private fun dispatchReading(reading: EngineReading) {
        mainHandler.post {
            if (reading.sessionId != 0L && reading.sessionId != sessionId) {
                return@post
            }
            val payload = Arguments.createMap()
            payload.putDouble("frequency", reading.frequency)
            payload.putInt("midi", reading.midi)
            payload.putDouble("cents", reading.cents)
            payload.putDouble("confidence", reading.confidence)
            payload.putDouble("rms", reading.rms)
            payload.putString("noteName", noteNameFor(reading.midi))
            payload.putInt("stringIndex", reading.stringIndex)
            payload.putArray("spectrum", numberArray(reading.spectrum))
            payload.putArray("chroma", numberArray(reading.chroma))
            payload.putArray("waveform", numberArray(reading.waveform))
            payload.putInt("chordRoot", reading.chordRoot)
            payload.putString("chordQuality", reading.chordQuality)
            payload.putString("chordName", chordNameFor(reading.chordRoot, reading.chordQuality))
            payload.putDouble("chordConfidence", reading.chordConfidence)
            payload.putArray("chordScores", numberArray(reading.chordScores))
            payload.putDouble("timestamp", reading.timestamp.toDouble())
            payload.putInt("sampleRate", reading.sampleRate)
            payload.putDouble("sessionId", reading.sessionId.toDouble())
            emit("PitchLabAudio.reading", payload)
        }
    }

    private fun dispatchRuntimeError(code: String, message: String) {
        mainHandler.post {
            val error = Arguments.createMap()
            error.putString("code", code)
            error.putString("message", message)
            error.putBoolean("recoverable", true)
            emitStatus("error", message, null, null, error)
            engine?.stop()
            engine = null
        }
    }

    private fun emitStatus(
        state: String,
        message: String? = null,
        sampleRate: Int? = null,
        analysisRate: Int? = null,
        error: WritableMap? = null,
    ) {
        val payload = Arguments.createMap()
        payload.putString("state", state)
        payload.putDouble("sessionId", sessionId.toDouble())
        if (message != null) {
            payload.putString("message", message)
        }
        if (sampleRate != null) {
            payload.putInt("sampleRate", sampleRate)
        }
        if (analysisRate != null) {
            payload.putInt("analysisRate", analysisRate)
        }
        if (error != null) {
            payload.putMap("error", error)
        }
        emit("PitchLabAudio.status", payload)
    }

    private fun emit(event: String, payload: WritableMap) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(event, payload)
        }
    }

    private fun numberArray(values: DoubleArray) = Arguments.createArray().also { array ->
        values.forEach { value -> array.pushDouble(value) }
    }

    private fun noteNameFor(midi: Int): String {
        if (midi < 0) {
            return ""
        }
        val names = arrayOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
        val pitchClass = ((midi % 12) + 12) % 12
        val octave = midi / 12 - 1
        return "${names[pitchClass]}$octave"
    }

    private fun chordNameFor(root: Int, quality: String): String {
        if (root < 0 || quality.isEmpty()) {
            return ""
        }
        val names = arrayOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
        return "${names[root % 12]}$quality"
    }

    override fun invalidate() {
        engine?.stop()
        engine = null
        super.invalidate()
    }

    override fun onCatalystInstanceDestroy() {
        engine?.stop()
        engine = null
        super.onCatalystInstanceDestroy()
    }
}
