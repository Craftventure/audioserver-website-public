import {Howl} from "howler";
import SpatialAudioManager from "@/audioserver/spatialaudiomanager";
import {PacketSpatialAudioUpdate} from "@/audioserver/packets";

export default class SpatialAudio {
    _id: number;
    _manager: SpatialAudioManager;
    _sound: Howl
    _baseVolume: number;
    _userVolume: number
    _fadeOutStartDistance: number
    _fadeOutEndDistance: number
    _source: string
    _sync: number | null

    constructor(manager: SpatialAudioManager, initialData: any) {
        this._id = initialData.areaId;
        this._manager = manager;
        this._baseVolume = 0;
        this._userVolume = 1;

        this._fadeOutStartDistance = 0;
        this._fadeOutEndDistance = 0;
        this._source = initialData.soundUrl;

        // console.log(initialData.soundUrl);
        this._sound = new Howl({
            src: [initialData.soundUrl],
            autoplay: true,
            volume: initialData.state.volume || 0.0,
            loop: initialData.state.loop || true,
            onload: () => {
                this._resync();
            }
        });
        this._sound.load();
        // @ts-ignore
        this._sound.orientation(0.0, 0.0, 0.0);
        // @ts-ignore
        let pannerAttr = this._sound.pannerAttr() as PannerAttr;
        // coneInnerAngle: 90.0,
        // coneOuterAngle : 90.0,
        // coneOuterGain: 180.0,
        // rolloffFactor: 1.0,
        // distanceModel: "inverse"
        pannerAttr.panningModel = initialData.state.panningModel || 'HRTF';
        pannerAttr.refDistance = initialData.state.refDistance || 1;
        pannerAttr.rolloffFactor = initialData.state.rolloffFactor || 0.1;
        pannerAttr.distanceModel = initialData.state.distanceModel || 'inverse';
        this._sound.pannerAttr(pannerAttr);
        this._sync = null;
        // console.log(this._sound);
        // console.log(initialData.state);
        this.update(initialData.state);
    }

    _updateVolume() {
        // @ts-ignore
        let playerLocation = this._manager.state.location;
        // console.log(playerLocation);
        // @ts-ignore
        let soundLocation = this._sound._pos;
        // console.log(this._sound);
        // console.log(playerLocation);
        // console.log(this._sound._pos);
        let distanceFadingMultiplier = 1.0;
        if (this._fadeOutEndDistance != null && this._fadeOutEndDistance !== this._fadeOutStartDistance) {
            if (soundLocation) {
                soundLocation = {x: soundLocation[0], y: soundLocation[1], z: soundLocation[2]};
                let xDiff = playerLocation.x - soundLocation.x;
                let yDiff = playerLocation.y - soundLocation.y;
                let zDiff = playerLocation.z - soundLocation.z;
                let distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff + zDiff * zDiff);
                // console.log(distance);
                if (distance > this._fadeOutStartDistance) {
                    let progress = 1 - ((distance - this._fadeOutStartDistance) / (this._fadeOutEndDistance - this._fadeOutStartDistance));
                    // console.log(progress);
                    if (progress > 1.0) progress = 1.0;
                    if (progress < 0.0) progress = 0.0;
                    distanceFadingMultiplier = progress;
                }
            } else {
                // console.log("No location");
            }
        }
        // console.log(distanceFadingMultiplier);
        let volume = this._userVolume * this._baseVolume * distanceFadingMultiplier;
        // console.log(`${this._baseVolume} > ${this._userVolume} > ${volume}`);
        this._sound.volume(volume);
    }

    setVolume(volume: number) {
        this._userVolume = volume;
        this._updateVolume();
    }

    isPlaying() {
        return this._sound.playing();
    }

    getSeek() {
        return this._sound.seek();
    }

    _resync() {
        // console.log(`Checking resync for ${this._sync} ${this._sound.playing()}`);
        if (this._sync != null) {

            if (this._sync === -1) {
                this._manager._audios.forEach(audio => {
                    if (audio.isPlaying() && audio._source === this._source) { // && audio.id !== areaId) {
                        let syncTo = audio.getSeek();
                        // console.log(`Resyncing to ${syncTo}`);
                        this._sound.seek(syncTo as number);
                        return
                    }
                    // console.log(audio);
                })
            }
            if (this._sync > 0) {
                if (this._sound.playing()) {
                    let now = new Date().getTime();
                    let resyncTarget = (now - this._sync) / 1000.0;
                    let duration = this._sound.duration();
                    // console.log(`Resync target is ${now} - ${this._sync} to seconds is ${resyncTarget} for ${this._source} and duration ${duration}`);
                    let pastLoops = Math.floor(resyncTarget / duration);
                    resyncTarget -= duration * pastLoops;
                    while (resyncTarget > duration) {
                        // console.log("While");
                        resyncTarget -= duration;
                    }
                    while (resyncTarget < 0) {
                        // console.log("While");
                        resyncTarget += duration;
                    }
                    console.log(`Resyncing to ${resyncTarget} duration=${duration}`);
                    this._sound.seek(resyncTarget);
                }
            }
        }
    }

    update(updatePacket: PacketSpatialAudioUpdate) {
        // console.log(updatePacket);

        if (typeof updatePacket.x !== "undefined" &&
            typeof updatePacket.y !== "undefined" &&
            typeof updatePacket.z !== "undefined") {
            this._sound.pos(updatePacket.x!!, updatePacket.y!!, updatePacket.z!!);
            this._updateVolume();
        }

        if (updatePacket.orientationX != null &&
            updatePacket.orientationY != null &&
            updatePacket.orientationZ != null) {
            // @ts-ignore
            this._sound.orientation(updatePacket.orientationX!!, updatePacket.orientationY!!, updatePacket.orientationZ!!);
        }

        if (typeof updatePacket.sync !== "undefined") {
            // console.log(`Setting sync to ${updatePacket.sync}`);
            this._sync = updatePacket.sync;
            this._resync();
        }
        if (typeof updatePacket.rate !== "undefined") {
            // console.log(`Setting rate to ${updatePacket.rate}`);
            this._sound.rate(updatePacket.rate!!);
        }
        if (typeof updatePacket.volume !== "undefined") {
            // console.log(`Setting volume to ${updatePacket.volume}`);
            this._baseVolume = updatePacket.volume!!;
            this._updateVolume();
        }
        if (typeof updatePacket.loop !== "undefined") {
            // console.log(`Setting loop to ${updatePacket.loop}`);
            this._sound.loop(updatePacket.loop!!);
        }
        if (typeof updatePacket.maxDistance !== "undefined") {
            // console.log(`Setting maxDistance to ${updatePacket.maxDistance}`);
            // @ts-ignore
            let pannerAttr = this._sound.pannerAttr() as PannerAttr;
            pannerAttr.maxDistance = updatePacket.maxDistance!!;
            this._sound.pannerAttr(pannerAttr);
        }
        if (typeof updatePacket.refDistance !== "undefined") {
            // console.log(`Setting refDistance to ${updatePacket.refDistance}`);
            // @ts-ignore
            let pannerAttr = this._sound.pannerAttr() as PannerAttr;
            pannerAttr.refDistance = updatePacket.refDistance!!;
            this._sound.pannerAttr(pannerAttr);
        }
        if (typeof updatePacket.fadeOutEndDistance !== "undefined") {
            // console.log(`Setting fadeOutEndDistance to ${updatePacket.fadeOutEndDistance}`);
            this._fadeOutEndDistance = updatePacket.fadeOutEndDistance!!;
            this._updateVolume();
        }
        if (typeof updatePacket.fadeOutStartDistance !== "undefined") {
            // console.log(`Setting fadeOutStartDistance to ${updatePacket.fadeOutStartDistance}`);
            this._fadeOutStartDistance = updatePacket.fadeOutStartDistance!!;
            this._updateVolume();
        }
        if (typeof updatePacket.playing !== "undefined") {
            if (updatePacket.playing === true) {
                if (!this._sound.playing()) {
                    // console.log(`Setting playing to ${updatePacket.audioId} ${updatePacket.playing}`);
                    this._sound.play();
                    this._resync();
                }
            } else {
                if (this._sound.playing()) {
                    // console.log(`Setting playing to ${updatePacket.audioId} ${updatePacket.playing}`);
                    this._sound.pause();
                }
            }
        }
    }

    release() {
        this._sound.pause();
        this._sound.stop();
        this._sound.unload();
    }
}