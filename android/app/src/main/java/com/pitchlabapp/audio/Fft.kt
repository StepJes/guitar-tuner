package com.pitchlabapp.audio

import kotlin.math.cos
import kotlin.math.sin

/**
 * Minimal in-place iterative radix-2 FFT used by the tuner analysis thread.
 * All buffers are power-of-two sized. No external math library is required.
 */
internal object Fft {
    fun nextPowerOfTwo(value: Int): Int {
        var result = 1
        while (result < value) {
            result = result shl 1
        }
        return result
    }

    fun forward(real: DoubleArray, imag: DoubleArray) {
        val n = real.size
        require(imag.size == n && n > 0 && n and (n - 1) == 0) { "FFT size must be a power of two" }

        var j = 0
        for (i in 1 until n) {
            var bit = n shr 1
            while (j and bit != 0) {
                j = j xor bit
                bit = bit shr 1
            }
            j = j xor bit
            if (i < j) {
                val tr = real[i]
                real[i] = real[j]
                real[j] = tr
                val ti = imag[i]
                imag[i] = imag[j]
                imag[j] = ti
            }
        }

        var length = 2
        while (length <= n) {
            val angle = -2.0 * Math.PI / length
            val wLengthReal = cos(angle)
            val wLengthImag = sin(angle)
            var start = 0
            while (start < n) {
                var wReal = 1.0
                var wImag = 0.0
                var k = 0
                while (k < length / 2) {
                    val even = start + k
                    val odd = even + length / 2
                    val oddReal = real[odd] * wReal - imag[odd] * wImag
                    val oddImag = real[odd] * wImag + imag[odd] * wReal
                    real[odd] = real[even] - oddReal
                    imag[odd] = imag[even] - oddImag
                    real[even] += oddReal
                    imag[even] += oddImag
                    val nextWReal = wReal * wLengthReal - wImag * wLengthImag
                    wImag = wReal * wLengthImag + wImag * wLengthReal
                    wReal = nextWReal
                    k += 1
                }
                start += length
            }
            length = length shl 1
        }
    }

    fun inverse(real: DoubleArray, imag: DoubleArray) {
        val n = real.size
        forward(real, imag)
        val scale = 1.0 / n
        for (i in 0 until n) {
            real[i] *= scale
            imag[i] = -imag[i] * scale
        }
    }

    /**
     * Autocorrelation by FFT. Returns an array of length >= sampleCount.
     * The input is zero-padded to at least twice its length to avoid circular
     * wrap-around in the correlation.
     */
    fun autocorrelation(samples: DoubleArray): DoubleArray {
        val size = nextPowerOfTwo(samples.size * 2)
        val real = DoubleArray(size)
        val imag = DoubleArray(size)
        System.arraycopy(samples, 0, real, 0, samples.size)
        forward(real, imag)
        for (i in 0 until size) {
            val power = real[i] * real[i] + imag[i] * imag[i]
            real[i] = power
            imag[i] = 0.0
        }
        inverse(real, imag)
        val out = DoubleArray(samples.size + 1)
        System.arraycopy(real, 0, out, 0, out.size)
        return out
    }
}
