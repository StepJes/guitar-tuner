package com.pitchlabapp.audio

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.core.content.ContextCompat
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.abs
import kotlin.math.log2
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

internal data class AudioEngineConfig(
    val sampleRate: Int,
    val analysisRate: Int,
    val a4Reference: Double,
    val temperamentCents: DoubleArray,
    val instrumentNotes: IntArray,
    val inTuneThreshold: Double,
    val audioSetupVersion: String,
    val audioAnalysisVersion: String,
    val debugMask: Int,
    val sessionId: Long,
)

internal data class EngineReading(
    val frequency: Double,
    val midi: Int,
    val cents: Double,
    val confidence: Double,
    val rms: Double,
    val stringIndex: Int,
    val spectrum: DoubleArray,
    val chroma: DoubleArray,
    val waveform: DoubleArray,
    val chordRoot: Int,
    val chordQuality: String,
    val chordConfidence: Double,
    val chordScores: DoubleArray,
    val timestamp: Long,
    val sampleRate: Int,
    val sessionId: Long,
)

internal class AudioEngine(
    private val context: android.content.Context,
    private val config: AudioEngineConfig,
    private val onReading: (EngineReading) -> Unit,
    private val onError: (code: String, message: String) -> Unit,
) {
    private val running = AtomicBoolean(false)
    private var record: AudioRecord? = null
    private var thread: Thread? = null
    private val windowSize: Int
    private val hopSize: Int
    private val readBlock: Int
    private val previousSpectrum = DoubleArray(SpectrumAnalyzer.BAND_COUNT)
    private val targets: DoubleArray
    private val targetStringIndices: IntArray

    init {
        val requestedWindow = (config.sampleRate * 0.185).toInt()
        windowSize = Fft.nextPowerOfTwo(max(2048, min(8192, requestedWindow)))
        val hopMilliseconds = when (config.analysisRate) {
            1 -> 45
            -1 -> 180
            else -> 90
        }
        hopSize = max(256, config.sampleRate * hopMilliseconds / 1000)
        readBlock = when (config.audioSetupVersion) {
            "1.0.0" -> max(512, min(1024, config.sampleRate / 24))
            "1.0.7" -> max(512, min(1536, config.sampleRate / 20))
            else -> max(512, min(2048, config.sampleRate / 20))
        }
        val filtered = ArrayList<Pair<Int, Double>>()
        for ((index, midi) in config.instrumentNotes.withIndex()) {
            filtered.add(index to PitchDetector.targetFrequency(midi, config.a4Reference, config.temperamentCents))
        }
        targets = DoubleArray(filtered.size) { filtered[it].second }
        targetStringIndices = IntArray(filtered.size) { filtered[it].first }
    }

    @Suppress("MissingPermission")
    fun start() {
        if (running.get()) {
            return
        }
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            throw SecurityException("Microphone permission has not been granted.")
        }

        val minBuffer = AudioRecord.getMinBufferSize(
            config.sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
        )
        if (minBuffer <= 0) {
            throw IllegalStateException("The device does not support a ${config.sampleRate} Hz mono input.")
        }
        val multiplier = when (config.audioSetupVersion) {
            "1.0.0" -> 1
            "1.0.7" -> 2
            else -> 4
        }
        val bufferSize = max(minBuffer * multiplier, windowSize * 2)
        val recorder = try {
            AudioRecord(
                MediaRecorder.AudioSource.MIC,
                config.sampleRate,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize,
            )
        } catch (caught: Throwable) {
            throw IllegalStateException("AudioRecord could not be created at ${config.sampleRate} Hz: ${caught.message}", caught)
        }
        if (recorder.state != AudioRecord.STATE_INITIALIZED) {
            recorder.release()
            throw IllegalStateException("AudioRecord failed to initialise at ${config.sampleRate} Hz.")
        }
        record = recorder
        try {
            recorder.startRecording()
        } catch (caught: Throwable) {
            recorder.release()
            record = null
            throw IllegalStateException("Microphone recording could not start: ${caught.message}", caught)
        }
        if (recorder.recordingState != AudioRecord.RECORDSTATE_RECORDING) {
            recorder.release()
            record = null
            throw IllegalStateException("Microphone recording did not enter the recording state.")
        }

        running.set(true)
        thread = Thread({ captureLoop() }, "PitchLabAudioCapture").also { worker ->
            worker.priority = Thread.MAX_PRIORITY
            worker.start()
        }
    }

    private fun captureLoop() {
        android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_AUDIO)
        val recorder = record ?: return
        val linear = DoubleArray(max(32768, windowSize * 3))
        val shortBuffer = ShortArray(readBlock)
        var filled = 0
        var samplesSinceAnalysis = 0
        var consecutiveErrors = 0

        try {
            while (running.get()) {
                val read = recorder.read(shortBuffer, 0, shortBuffer.size)
                if (read > 0) {
                    consecutiveErrors = 0
                    if (filled + read > linear.size) {
                        val discard = filled + read - linear.size
                        System.arraycopy(linear, discard, linear, 0, filled - discard)
                        filled -= discard
                    }
                    for (index in 0 until read) {
                        linear[filled + index] = shortBuffer[index] / 32768.0
                    }
                    filled += read
                    samplesSinceAnalysis += read
                    if (samplesSinceAnalysis >= hopSize && filled >= windowSize) {
                        samplesSinceAnalysis = 0
                        val window = DoubleArray(windowSize)
                        System.arraycopy(linear, filled - windowSize, window, 0, windowSize)
                        analyse(window)
                    }
                } else if (read < 0) {
                    consecutiveErrors += 1
                    if (consecutiveErrors >= 6) {
                        onError("AUDIO_READ_FAILED", "The microphone stopped responding (read error $read).")
                        running.set(false)
                        break
                    }
                    Thread.sleep(20)
                } else {
                    Thread.sleep(5)
                }
            }
        } catch (interrupted: InterruptedException) {
            Thread.currentThread().interrupt()
        } catch (caught: Throwable) {
            if (running.get()) {
                onError("AUDIO_ANALYSIS_FAILED", caught.message ?: "Audio analysis failed.")
            }
        } finally {
            running.set(false)
        }
    }

    private fun analyse(window: DoubleArray) {
        val rawRms = PitchDetector.rms(window)
        val pitch = PitchDetector.detect(
            window,
            config.sampleRate,
            config.audioAnalysisVersion == "1.0.15",
        )

        val fftSize = Fft.nextPowerOfTwo(window.size)
        val real = DoubleArray(fftSize)
        val imag = DoubleArray(fftSize)
        SpectrumAnalyzer.spectrum(real, imag, config.sampleRate, window)
        val spectrum = SpectrumAnalyzer.bands(real, imag, config.sampleRate, previousSpectrum)
        System.arraycopy(spectrum, 0, previousSpectrum, 0, spectrum.size)
        val chroma = SpectrumAnalyzer.chroma(real, imag, config.sampleRate)
        val chord = ChordAnalyzer.estimate(chroma, rawRms)

        var midi = -1
        var cents = 0.0
        var stringIndex = -1
        var frequency = pitch.frequency
        if (frequency > 0.0 && pitch.confidence >= 0.25 && rawRms >= 0.0015) {
            val approximate = 69.0 + 12.0 * log2(frequency / config.a4Reference)
            val base = approximate.roundToInt()
            var bestMidi = base
            var bestCents = Double.MAX_VALUE
            for (candidate in (base - 1)..(base + 1)) {
                if (candidate < 0 || candidate > 127) {
                    continue
                }
                val target = PitchDetector.targetFrequency(candidate, config.a4Reference, config.temperamentCents)
                val candidateCents = 1200.0 * log2(frequency / target)
                if (abs(candidateCents) < abs(bestCents)) {
                    bestCents = candidateCents
                    bestMidi = candidate
                }
            }
            midi = bestMidi
            cents = bestCents
            var nearestCents = Double.MAX_VALUE
            for (index in targets.indices) {
                val target = targets[index]
                if (target <= 0.0) {
                    continue
                }
                val candidateCents = 1200.0 * log2(frequency / target)
                if (abs(candidateCents) < nearestCents) {
                    nearestCents = abs(candidateCents)
                    stringIndex = targetStringIndices[index]
                }
            }
            if (nearestCents > 250.0) {
                stringIndex = -1
            }
        } else {
            frequency = 0.0
        }

        val waveform = DoubleArray(128)
        val step = max(1, window.size / waveform.size)
        var peak = 1e-6
        for (index in 0 until 128) {
            val sampleIndex = min(window.size - 1, index * step)
            val value = window[sampleIndex]
            waveform[index] = value
            peak = max(peak, abs(value))
        }
        for (index in 0 until 128) {
            waveform[index] = (waveform[index] / peak).coerceIn(-1.0, 1.0)
        }

        val chordConfidence = if (chord.root >= 0 && chord.confidence >= 0.22) chord.confidence else 0.0
        val reading = EngineReading(
            frequency = frequency,
            midi = midi,
            cents = cents,
            confidence = pitch.confidence,
            rms = (rawRms * 14.0).coerceIn(0.0, 1.0),
            stringIndex = stringIndex,
            spectrum = spectrum,
            chroma = chroma,
            waveform = waveform,
            chordRoot = if (chordConfidence > 0.0) chord.root else -1,
            chordQuality = if (chordConfidence > 0.0) chord.quality else "",
            chordConfidence = chordConfidence,
            chordScores = chord.scores,
            timestamp = System.currentTimeMillis(),
            sampleRate = config.sampleRate,
            sessionId = config.sessionId,
        )
        onReading(reading)
    }

    fun stop() {
        running.set(false)
        val recorder = record
        record = null
        try {
            if (recorder?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                recorder.stop()
            }
        } catch (_: Throwable) {
        }
        val worker = thread
        thread = null
        if (worker != null && worker !== Thread.currentThread()) {
            try {
                worker.join(1200)
            } catch (_: InterruptedException) {
                Thread.currentThread().interrupt()
            }
        }
        try {
            recorder?.release()
        } catch (_: Throwable) {
        }
    }
}
