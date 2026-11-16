package com.pitchlabapp.audio

import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.log2
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow

internal data class PitchResult(val frequency: Double, val confidence: Double)

internal object PitchDetector {
    private const val MIN_FREQUENCY = 25.0
    private const val MAX_FREQUENCY = 5000.0

    fun detect(input: DoubleArray, sampleRate: Int, legacy: Boolean): PitchResult {
        if (input.size < 256) {
            return PitchResult(0.0, 0.0)
        }
        return if (legacy) detectLegacy(input, sampleRate) else detectCmndf(input, sampleRate)
    }

    private fun detectCmndf(input: DoubleArray, sampleRate: Int): PitchResult {
        val n = input.size
        val samples = DoubleArray(n)
        var mean = 0.0
        for (value in input) {
            mean += value
        }
        mean /= n
        for (i in 0 until n) {
            samples[i] = input[i] - mean
        }

        val maxLag = min((sampleRate / MIN_FREQUENCY).toInt(), n / 2)
        val minLag = max(2, (sampleRate / MAX_FREQUENCY).toInt())
        if (maxLag <= minLag + 2) {
            return PitchResult(0.0, 0.0)
        }

        val prefixEnergy = DoubleArray(n + 1)
        for (i in 0 until n) {
            prefixEnergy[i + 1] = prefixEnergy[i] + samples[i] * samples[i]
        }
        val totalEnergy = prefixEnergy[n]
        if (totalEnergy < 1e-12) {
            return PitchResult(0.0, 0.0)
        }

        val correlation = Fft.autocorrelation(samples)
        val difference = DoubleArray(maxLag + 1)
        val cmndf = DoubleArray(maxLag + 1)
        cmndf[0] = 1.0
        var running = 0.0

        for (tau in 1..maxLag) {
            val energyA = prefixEnergy[n - tau]
            val energyB = totalEnergy - prefixEnergy[tau]
            val diff = max(0.0, energyA + energyB - 2.0 * correlation[tau])
            difference[tau] = diff
            running += diff
            cmndf[tau] = if (running > 1e-12) diff * tau / running else 1.0
        }

        var bestLag = -1
        var tau = minLag
        while (tau <= maxLag) {
            if (cmndf[tau] < 0.20) {
                while (tau + 1 <= maxLag && cmndf[tau + 1] < cmndf[tau]) {
                    tau += 1
                }
                bestLag = tau
                break
            }
            tau += 1
        }
        if (bestLag < 0) {
            var bestValue = 1.0
            for (candidate in minLag..maxLag) {
                if (cmndf[candidate] < bestValue) {
                    bestValue = cmndf[candidate]
                    bestLag = candidate
                }
            }
        }
        if (bestLag < 0) {
            return PitchResult(0.0, 0.0)
        }

        var refinedLag = bestLag.toDouble()
        if (bestLag > 1 && bestLag < maxLag) {
            val left = cmndf[bestLag - 1]
            val centre = cmndf[bestLag]
            val right = cmndf[bestLag + 1]
            val denominator = left - 2.0 * centre + right
            if (abs(denominator) > 1e-9) {
                val delta = 0.5 * (left - right) / denominator
                if (delta > -0.5 && delta < 0.5) {
                    refinedLag += delta
                }
            }
        }

        val confidence = (1.0 - cmndf[bestLag]).coerceIn(0.0, 1.0)
        if (confidence < 0.22) {
            return PitchResult(0.0, confidence)
        }

        var frequency = sampleRate / refinedLag
        if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
            return PitchResult(0.0, confidence)
        }

        // A very strong even/third sub-harmonic is usually the true fundamental
        // for a plucked string whose first harmonic dominates.
        for (divisor in intArrayOf(3, 2)) {
            val candidate = frequency / divisor
            if (candidate < MIN_FREQUENCY) {
                continue
            }
            val lag = sampleRate / candidate
            if (lag < minLag || lag > maxLag) {
                continue
            }
            val neighbourhood = intArrayOf(
                floor(lag).toInt() - 1,
                floor(lag).toInt(),
                floor(lag).toInt() + 1,
            )
            var lowest = 1.0
            for (index in neighbourhood) {
                if (index in minLag..maxLag) {
                    lowest = min(lowest, cmndf[index])
                }
            }
            if (lowest < 0.16 && lowest < cmndf[bestLag] + 0.08) {
                frequency = candidate
                break
            }
        }

        return PitchResult(frequency.coerceIn(MIN_FREQUENCY, MAX_FREQUENCY), confidence)
    }

    private fun detectLegacy(input: DoubleArray, sampleRate: Int): PitchResult {
        val n = input.size
        val fftSize = Fft.nextPowerOfTwo(n)
        val real = DoubleArray(fftSize)
        val imag = DoubleArray(fftSize)
        var mean = 0.0
        for (value in input) {
            mean += value
        }
        mean /= n
        for (i in 0 until n) {
            val window = 0.5 - 0.5 * cos(2.0 * Math.PI * i / (n - 1).coerceAtLeast(1))
            real[i] = (input[i] - mean) * window
        }
        Fft.forward(real, imag)

        val minBin = max(2, (55.0 * fftSize / sampleRate).toInt())
        val maxBin = min(fftSize / 2 - 2, (1800.0 * fftSize / sampleRate).toInt())
        if (maxBin <= minBin) {
            return PitchResult(0.0, 0.0)
        }

        val magnitudes = DoubleArray(maxBin + 2)
        var strongest = 0.0
        for (bin in minBin..maxBin) {
            val magnitude = Math.hypot(real[bin], imag[bin])
            magnitudes[bin] = magnitude
            strongest = max(strongest, magnitude)
        }
        if (strongest < 1e-7) {
            return PitchResult(0.0, 0.0)
        }

        var chosen = -1
        for (bin in minBin until maxBin) {
            if (
                magnitudes[bin] > strongest * 0.24 &&
                magnitudes[bin] >= magnitudes[bin - 1] &&
                magnitudes[bin] >= magnitudes[bin + 1]
            ) {
                chosen = bin
                break
            }
        }
        if (chosen < 0) {
            chosen = magnitudes.indices.maxByOrNull { magnitudes[it] } ?: minBin
        }

        var bestMagnitude = magnitudes[chosen]
        var refinedBin = chosen.toDouble()
        val left = magnitudes[(chosen - 1).coerceAtLeast(1)]
        val centre = magnitudes[chosen]
        val right = magnitudes[(chosen + 1).coerceAtMost(maxBin)]
        val denom = left - 2.0 * centre + right
        if (abs(denom) > 1e-12) {
            val delta = 0.5 * (left - right) / denom
            if (delta > -0.5 && delta < 0.5) {
                refinedBin += delta
            }
        }

        var frequency = refinedBin * sampleRate / fftSize
        val candidates = listOf(frequency / 2.0, frequency / 3.0)
        for (candidate in candidates) {
            if (candidate < 45.0) {
                continue
            }
            val bin = candidate * fftSize / sampleRate
            val index = bin.toInt().coerceIn(minBin, maxBin)
            var local = 0.0
            for (offset in -1..1) {
                val target = (index + offset).coerceIn(minBin, maxBin)
                local = max(local, magnitudes[target])
            }
            if (local > bestMagnitude * 0.055 && local > strongest * 0.03) {
                frequency = candidate
                bestMagnitude = max(bestMagnitude, local)
                break
            }
        }

        val relative = (bestMagnitude / strongest).coerceIn(0.0, 1.0)
        val harmonicConfidence = min(1.0, 0.30 + relative * 0.70)
        if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
            return PitchResult(0.0, harmonicConfidence)
        }
        return PitchResult(frequency, harmonicConfidence)
    }

    fun rms(input: DoubleArray): Double {
        if (input.isEmpty()) {
            return 0.0
        }
        var sum = 0.0
        for (value in input) {
            sum += value * value
        }
        return kotlin.math.sqrt(sum / input.size)
    }

    fun dbfs(input: DoubleArray): Double {
        val rms = rms(input)
        if (rms <= 0.0) {
            return -120.0
        }
        return 20.0 * ln(rms) / ln(10.0)
    }

    fun midiOffsetForFrequency(frequency: Double, a4: Double): Double {
        if (frequency <= 0.0 || a4 <= 0.0) {
            return 0.0
        }
        return 69.0 + 12.0 * log2(frequency / a4)
    }

    fun targetFrequency(midi: Int, a4: Double, temperamentCents: DoubleArray): Double {
        val offset = if (temperamentCents.size == 12) temperamentCents[((midi % 12) + 12) % 12] else 0.0
        return a4 * 2.0.pow((midi - 69) / 12.0) * 2.0.pow(offset / 1200.0)
    }
}
