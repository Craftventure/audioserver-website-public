import {Vue} from "vue-property-decorator";
import {EasingFunctions} from "@/audioserver/easings";

export default class AudioFilter {
    audioNode: AudioNode
    audioContext: AudioContext
    areas: FeatheredArea[]
    config: AudioFilterConfig

    constructor(audioContext: AudioContext, config: AudioFilterConfig) {
        // console.log(config)
        this.audioContext = audioContext
        this.config = config
        this.areas = config.areas.map(area => new FeatheredArea(area, config.feather))
        if (config.kind == "biquad") {
            let node = audioContext.createBiquadFilter()
            node.type = config.type as BiquadFilterType
            this.audioNode = node
        } else {
            this.audioNode = audioContext.createGain()
        }
        this.audioNode.connect(audioContext.destination)

        this.update()
    }

    update() {
        let highestEnabledState = 0
        this.areas.forEach(area => {
            let percentage = area.enabledPercentage
            if (percentage > highestEnabledState) {
                highestEnabledState = percentage
            }
        })
        // console.log(`Updating filter with percentage ${highestEnabledState}`)

        if (this.config.kind == "biquad") {
            const node = this.audioNode as BiquadFilterNode

            if (this.config.easing != null) {
                let easingMethod = (EasingFunctions as any)[this.config.easing]
                if (easingMethod != null) {
                    highestEnabledState = easingMethod(highestEnabledState)
                }
            }

            if (this.config.frequency != null) {
                let frequencyInactive = Math.max(this.config.frequency!!.inactive!!, node.frequency.minValue)
                let frequencyActive = Math.min(this.config.frequency!!.active!!, node.frequency.maxValue)
                node.frequency.value = frequencyInactive + ((frequencyActive - frequencyInactive) * highestEnabledState);
            }

            if (this.config.q != null) {
                let qInactive = Math.max(this.config.q!!.inactive!!, node.frequency.minValue)
                let qActive = Math.min(this.config.q!!.active!!, node.frequency.maxValue)
                node.Q.value = qInactive + ((qActive - qInactive) * highestEnabledState);
            }

            if (this.config.gain != null) {
                let gainInactive = Math.max(this.config.gain!!.inactive!!, node.gain.minValue)
                let gainActive = Math.min(this.config.gain!!.active!!, node.gain.maxValue)
                node.gain.value = gainInactive + ((gainActive - gainInactive) * highestEnabledState);
            }

            // console.log("frequency", node.frequency.value, node.frequency.minValue, node.frequency.maxValue)
            // console.log("q", node.Q.value, node.Q.minValue, node.Q.maxValue)
            // console.log("gain", node.gain.value, node.gain.minValue, node.gain.maxValue)
        }
    }

    release() {
        this.audioNode.disconnect()
    }
}

export class FeatheredArea {
    area: AudioFilterArea
    feather: number

    constructor(area: AudioFilterArea, feather: number) {
        this.area = area
        this.feather = feather
    }

    get enabledPercentage(): number {
        const distance = this.currentDistance;
        if (distance <= 0) return 0
        if (distance > this.feather) return 1
        return distance / this.feather
    }

    /**
     * @return Positive number when inside, returned number in that case is the most close border distance, 0 when outside of the area
     */
    get currentDistance(): number {
        let location = Vue.prototype.$audioServer.managedData.location
        let x = location.x!!
        let y = location.y!!
        let z = location.z!!

        if (x > this.area.min.x && x < this.area.max.x &&
            y > this.area.min.y && y < this.area.max.y &&
            z > this.area.min.z && z < this.area.max.z) {
            let xMin = x - this.area.min.x
            let xMax = this.area.max.x - x
            let yMin = y - this.area.min.y
            let yMax = this.area.max.y - y
            let zMin = z - this.area.min.z
            let zMax = this.area.max.z - z

            return Math.min(xMin, xMax, yMin, yMax, zMin, zMax)
        }

        return 0
    }
}

function makeDistortionCurve(amount: number) {
    var k = amount,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180,
        i = 0,
        x;
    for (; i < n_samples; ++i) {
        x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg /
            (Math.PI + k * Math.abs(x));
    }
    return curve;
}

export interface AudioFilterArea {
    min: AudioFilterAreaCorner,
    max: AudioFilterAreaCorner
}

export interface AudioFilterAreaCorner {
    x: number,
    y: number,
    z: number
}

export interface AudioFilterConfig {
    areas: AudioFilterArea[],
    feather: number,
    easing?: string,
    kind: string,
    type: string,
    frequency?: AudioValuePair<number>,
    detune?: AudioValuePair<number>,
    gain?: AudioValuePair<number>,
    q?: AudioValuePair<number>
}

export interface AudioValuePair<T> {
    active: T
    inactive: T
}