package com.pitchlabapp.audio

import kotlin.math.abs
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sqrt

internal object SpectrumAnalyzer {
    const val BAND_COUNT = 96

    fun bands(
        real: DoubleArray,
        imag: DoubleArray,
        sampleRate: Int,
        previous: DoubleArray,
    ): DoubleArray {
        val fftSize = real.size
        val nyquist = sampleRate / 2.0
        val bottom = 30.0
        val top = min(6000.0, nyquist * 0.98)
        val result = DoubleArray(BAND_COUNT)
        if (top <= bottom) {
            return result
        }
        val ratio = top / bottom
        val normalizer = 2.0 / fftSize

        for (band in 0 until BAND_COUNT) {
            val from = bottom * ratio.pow(band.toDouble() / BAND_COUNT)
            val to = bottom * ratio.pow((band + 1).toDouble() / BAND_COUNT)
            var firstBin = (from * fftSize / sampleRate).toInt().coerceAtLeast(1)
            var lastBin = (to * fftSize / sampleRate).toInt().coerceAtLeast(firstBin)
            lastBin = min(lastBin, fftSize / 2 - 1)
            firstBin = max(1, min(firstBin, lastBin))

            var peak = 0.0
            for (bin in firstBin..lastBin) {
                val magnitude = sqrt(real[bin] * real[bin] + imag[bin] * imag[bin]) * normalizer
                if (magnitude > peak) {
                    peak = magnitude
                }
            }
            val db = if (peak > 1e-9) 20.0 * log10(peak) else -90.0
            val normalized = ((db + 80.0) / 80.0).coerceIn(0.0, 1.0)
            val perceptual = sqrt(normalized)
            val old = if (band < previous.size) previous[band] else 0.0
            val coefficient = if (perceptual > old) 0.62 else 0.24
            result[band] = old + (perceptual - old) * coefficient
        }
        return result
    }

    fun spectrum(real: DoubleArray, imag: DoubleArray, sampleRate: Int, window: DoubleArray): Pair<DoubleArray, DoubleArray> {
        val fftSize = real.size
        real.fill(0.0)
        imag.fill(0.0)
        var mean = 0.0
        for (value in window) {
            mean += value
        }
        mean /= window.size.coerceAtLeast(1)
        for (i in window.indices) {
            if (i >= fftSize) {
                break
            }
            val hann = 0.5 - 0.5 * kotlin.math.cos(2.0 * Math.PI * i / (window.size - 1).coerceAtLeast(1))
            real[i] = (window[i] - mean) * hann
        }
        Fft.forward(real, imag)
        return Pair(real, imag)
    }

    fun chroma(real: DoubleArray, imag: DoubleArray, sampleRate: Int): DoubleArray {
        val fftSize = real.size
        val nyquist = sampleRate / 2.0
        val maxFrequency = min(2200.0, nyquist * 0.94)
        val minBin = max(2, (55.0 * fftSize / sampleRate).toInt())
        val maxBin = min(fftSize / 2 - 2, (maxFrequency * fftSize / sampleRate).toInt())
        if (maxBin <= minBin + 4) {
            return DoubleArray(12)
        }

        val magnitudes = DoubleArray(maxBin + 2)
        var strongest = 0.0
        for (bin in minBin..maxBin) {
            val magnitude = sqrt(real[bin] * real[bin] + imag[bin] * imag[bin])
            magnitudes[bin] = magnitude
            strongest = max(strongest, magnitude)
        }
        if (strongest < 1e-7) {
            return DoubleArray(12)
        }

        data class Peak(val bin: Int, val frequency: Double, var magnitude: Double, var weight: Double)

        val peaks = ArrayList<Peak>()
        val threshold = strongest * 0.008
        for (bin in minBin + 2 until maxBin - 1) {
            val magnitude = magnitudes[bin]
            if (
                magnitude < threshold ||
                magnitude < magnitudes[bin - 1] ||
                magnitude < magnitudes[bin + 1]
            ) {
                continue
            }
            val left = magnitudes[bin - 1]
            val right = magnitudes[bin + 1]
            val denominator = left - 2.0 * magnitude + right
            var refined = bin.toDouble()
            if (abs(denominator) > 1e-12) {
                val delta = 0.5 * (left - right) / denominator
                if (delta > -0.5 && delta < 0.5) {
                    refined += delta
                }
            }
            val frequency = refined * sampleRate / fftSize
            if (frequency in 55.0..maxFrequency) {
                val lowEmphasis = sqrt(220.0 / frequency).coerceIn(0.45, 2.6)
                peaks.add(Peak(bin, frequency, magnitude, sqrt(magnitude) * lowEmphasis))
            }
        }
        if (peaks.isEmpty()) {
            return DoubleArray(12)
        }

        peaks.sortByDescending { it.weight }
        if (peaks.size > 48) {
            peaks.subList(48, peaks.size).clear()
        }

        // Suppress upper harmonics that are integer multiples of a lower peak.
        for (index in peaks.indices) {
            val peak = peaks[index]
            for (otherIndex in peaks.indices) {
                if (index == otherIndex) {
                    continue
                }
                val lower = peaks[otherIndex]
                if (lower.frequency >= peak.frequency * 0.94) {
                    continue
                }
                val ratio = peak.frequency / lower.frequency
                val nearestInteger = ratio.roundToInt()
                if (nearestInteger in 2..8 && abs(ratio - nearestInteger) < 0.018) {
                    if (lower.weight >= peak.weight * 0.18) {
                        peak.weight *= 0.14
                        break
                    }
                }
            }
        }

        val chroma = DoubleArray(12)
        for (peak in peaks) {
            val midi = 69.0 + 12.0 * kotlin.math.log2(peak.frequency / 440.0)
            val pitchClass = ((midi.roundToInt() % 12) + 12) % 12
            chroma[pitchClass] += peak.weight
        }

        val sorted = chroma.sortedArray()
        val median = sorted[6]
        var maximum = 0.0
        for (index in 0 until 12) {
            chroma[index] = (chroma[index] - median * 0.28).coerceAtLeast(0.0)
            maximum = max(maximum, chroma[index])
        }
        if (maximum > 1e-9) {
            for (index in 0 until 12) {
                chroma[index] /= maximum
            }
        }
        return chroma
    }
}

internal object ChordAnalyzer {
    private val TEMPLATES = arrayOf(
        intArrayOf(0, 4, 7),
        intArrayOf(0, 3, 7),
        intArrayOf(0, 4, 7, 11),
        intArrayOf(0, 3, 7, 10),
        intArrayOf(0, 4, 7, 10),
        intArrayOf(0, 3, 6, 9),
    )
    val QUALITIES = arrayOf("maj", "min", "maj7", "min7", "dom7", "dim7")

    data class Result(
        val root: Int,
        val quality: String,
        val confidence: Double,
        val scores: DoubleArray,
    )

    fun estimate(chroma: DoubleArray, totalEnergy: Double): Result {
        val scores = DoubleArray(72)
        val toneMask = BooleanArray(12)
        if (percentage(chroma) < 0.015 || totalEnergy < 0.0004) {
            return Result(-1, "", 0.0, scores)
        }

        for (root in 0 until 12) {
            for (qualityIndex in TEMPLATES.indices) {
                val template = TEMPLATES[qualityIndex]
                toneMask.fill(false)
                for (interval in template) {
                    toneMask[(root + interval) % 12] = true
                }
                var toneSum = 0.0
                for (interval in template) {
                    toneSum += chroma[(root + interval) % 12]
                }
                val toneAverage = toneSum / template.size
                var nonToneSum = 0.0
                var nonToneCount = 0
                for (pitchClass in 0 until 12) {
                    if (!toneMask[pitchClass]) {
                        nonToneSum += chroma[pitchClass]
                        nonToneCount += 1
                    }
                }
                val nonToneAverage = if (nonToneCount > 0) nonToneSum / nonToneCount else 0.0
                val rootSupport = chroma[root]
                scores[root * 6 + qualityIndex] =
                    (rootSupport * 0.30 + toneAverage * 0.56 - nonToneAverage * 0.30)
                        .coerceAtLeast(0.0)
            }
        }

        var topIndex = 0
        var topScore = scores[0]
        var secondScore = 0.0
        var sum = 0.0
        for (index in scores.indices) {
            val score = scores[index]
            sum += score
            if (score > topScore) {
                secondScore = topScore
                topScore = score
                topIndex = index
            } else if (score > secondScore && index != topIndex) {
                secondScore = score
            }
        }
        if (topScore <= 1e-9) {
            return Result(-1, "", 0.0, scores)
        }
        val mean = sum / scores.size
        val normalized = DoubleArray(72)
        for (index in scores.indices) {
            normalized[index] = (scores[index] / topScore).coerceIn(0.0, 1.0)
        }
        val confidence = ((topScore - secondScore) * 2.3 + (topScore - mean) * 0.9).coerceIn(0.0, 1.0)
        val root = topIndex / 6
        val quality = QUALITIES[topIndex % 6]
        return Result(root, quality, confidence, normalized)
    }

    private fun percentage(values: DoubleArray): Double {
        var sum = 0.0
        var nonzero = 0
        for (value in values) {
            if (value > 0.05) {
                sum += value
                nonzero += 1
            }
        }
        if (values.isEmpty()) {
            return 0.0
        }
        val denominator = values.size.toDouble() * values.size.toDouble()
        return (sum * nonzero) / denominator
    }
}
