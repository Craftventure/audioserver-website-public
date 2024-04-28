import Vue from "vue";
import AudioArea from "@/audioserver/audioarea";
import {isSafari} from "@/utils";

export default class AudioResource {
    resource: any
    audio?: HTMLAudioElement;
    state = new Vue({
        data: {
            ready: false,
            duration: 0,
            playWhenReady: false,
            playing: false
        }
    });
    audioContext: AudioContext
    source?: MediaElementAudioSourceNode
    gainNode?: GainNode

    constructor(resource: any, area: AudioArea) {
        this.audioContext = area.audioContext;
        this.gainNode = this.audioContext.createGain()
        // console.log(this.audioContext.state)
        // this.audioContext.onstatechange = (event: any) => {
        //     console.log(event)
        // }

        this.resource = resource;
        this.audio = new Audio(resource.location as string);
        this.audio.crossOrigin = 'anonymous'
        if (isSafari())
            this.audio.load()

        this.source = this.audioContext.createMediaElementSource(this.audio!!)
        this.source.connect(area.startNode)//this.biquadFilterNode)

        this.audio.ondurationchange = () => {
            // console.log(`ondurationchange of ${resource.location} ${this.audio!!.duration}s`);

            const hadDuration = this.state.duration !== null && this.state.duration !== 0;

            if (hadDuration) {
                // Quickfix, don't update duration when we already received one!
                // console.warn(`Received a duration for resource=${this.resource.location} (${this.state.duration})`);
                return;
            }

            this.state.duration = this.audio!!.duration;
        };
        this.audio.oncanplay = () => {
            // console.log(`oncanplay of ${resource.location}`);

            if (!this.state.ready) {
                this.state.ready = true;
            }
        };
        this.audio.onplaying = () => {
            // console.log(`onplaying of ${resource.location}`);

            if (!this.state.playing) {
                this.state.playing = true;
                // console.log(`Set playing true for ${this.resource.location}`);
            }
        };
        this.audio.onpause = () => {
            // console.log(`onpause of ${resource.location}`);

            if (this.state.playing) {
                this.state.playing = false;
                // console.log(`Set playing false for ${this.resource.location}`);
            }
        };
        this.audio.onended = () => {
            // console.log(`onended of ${resource.location}`);

            if (this.state.playing || this.state.playWhenReady) {
                this.state.playing = false;
                this.state.playWhenReady = false;
                // console.log(`Set playing false for ${this.resource.location}`);
            }
        };
        this.audio.onstalled = () => {
            // console.warn(`onstalled of ${resource.location}`);

            this.state.ready = true;
            this.state.duration = 0;
        };
        this.audio.volume = 1;
        this.audio.preload = "metadata";
        // this.audio.load();
    }

    load() {
        this.audio?.load()
    }

    describe() {
        if (this.resource.artist != null && this.resource.name != null) {
            return this.resource.artist + " - " + this.resource.name
        } else if (this.resource.artist != null) {
            return this.resource.artist;
        } else if (this.resource.name != null) {
            return this.resource.name;
        }
        return null;
    }

    // setVolume(newVolume: number) {
    //     if (this.audio) {
    //         if (newVolume === 0) {
    //             // this.gainNode!!.gain!!.value = 0
    //             this.audio.volume = 0;
    //         } else {
    //             // this.gainNode!!.gain!!.value = newVolume
    //             this.audio.volume = newVolume;
    //             // this.audio.volume = Math.pow(100.0, newVolume * 100.0 / 100.0) / 100.0;
    //         }
    //     }
    // }

    syncToMs(sync: number) {
        if (this.audio) {
            let newTime = sync / 1000;
            if (newTime > this.audio.currentTime + 0.1 || newTime < this.audio.currentTime - 0.1) {
                // console.log(`Syncing ${this.resource.location} from ${this.audio.currentTime} to ${sync / 1000}`);
                this.audio.currentTime = newTime;
            }
        }
    }

    getDurationInMs() {
        return this.state.duration * 1000;
    }

    play() {
        if (this.state.playWhenReady)
            return;

        // console.log(`Play ${this.resource.location}`);
        // console.trace()

        this.state.playWhenReady = true;

        if (this.audio != null) {
            this.audio.play();
            return true;
        }
        return false;
    }

    pause() {
        if (!this.state.playWhenReady)
            return;

        // console.log(`Pause ${this.resource.location}`);
        // console.trace()

        this.state.playWhenReady = false;

        if (this.audio != null) {
            this.audio.pause();
            return true;
        }
        return false;
    }

    clean() {
        if (this.audio != null) {
            this.source?.disconnect()
            this.audio.pause();
            this.audio = undefined;
        }
    }
}