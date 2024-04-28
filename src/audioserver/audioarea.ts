import Vue from "vue";
import {RepeatType} from "@/audioserver/audioserverconstants";
import {PacketAreaDefinition, PacketDisplayAreaEnter} from "@/audioserver/packets";
import AudioResource from "@/audioserver/audioresource";
import AreaManager from "@/audioserver/areamanager";
import AudioFilter, {AudioFilterConfig} from "@/audioserver/audiofilter";

export default class AudioArea {
    // @ts-ignore
    state = new Vue({
        data: {
            hasFinished: false,
            playing: false,
            playWhenReady: false,
            resourcesReady: false,
            isOverridden: false
        },
        computed: {
            _dateCorrection: function () {
                return this.$audioServer.state.dateCorrection;
            },
            shouldDisplay: () => {
                return this.state.$data.playing && !this.state.$data.hasFinished;
            }
        }
    });
    _areaManager: AreaManager
    areaId: number
    name: string
    displayName: string
    _resources: AudioResource[]
    _overrides: string[]
    _fadeTime: number
    _sync: number
    _baseVolume: number
    _repeatType: string
    _areaDefinitionPacket: PacketAreaDefinition
    _fadeMultiply: number
    _isSyncing: boolean
    _fadeTask: number | null
    _hasLoadedAllResource: boolean = false

    audioContext: AudioContext
    startNode: AudioNode
    filters: AudioFilter[] = []

    constructor(areaDefinitionPacket: PacketAreaDefinition, areaManager: AreaManager) {
        // console.log(areaDefinitionPacket);
        this.audioContext = Vue.prototype.$audioServer.audioContext;
        this.startNode = this.audioContext.createGain()
        this._areaManager = areaManager;
        this.areaId = areaDefinitionPacket.areaId || -1;
        this.name = areaDefinitionPacket.name!!;
        this.displayName = areaDefinitionPacket.displayName!!;
        this._resources = [];
        this._overrides = areaDefinitionPacket.overrides || [];
        this._fadeTime = areaDefinitionPacket.fadeTime || 0;
        this._sync = areaDefinitionPacket.sync || 0;
        this._baseVolume = areaDefinitionPacket.volume || 1.0;
        this._repeatType = areaDefinitionPacket.repeatType || RepeatType.REPEAT_SEQUENCE;
        this._areaDefinitionPacket = areaDefinitionPacket;

        this.filters = areaDefinitionPacket.filters.map((item: AudioFilterConfig) => {
            return new AudioFilter(this.audioContext, item)
        })

        if (this.filters.length > 0) {
            this.startNode.connect(this.filters[0].audioNode)
        } else {
            this.startNode.connect(this.audioContext.destination)
        }

        this._fadeMultiply = 0;
        this._isSyncing = false;
        this._fadeTask = null;

        this.state.$watch("dateCorrection", () => {
            this._triggerDateCorrectionUpdate();
            this._resync();
        }, {immediate: true});

        this.state.$watch((e: any) => {
            // console.trace();
            // console.log(`State for ${this.name}: playing=${e.playing} playWhenReady=${e.playWhenReady} resourcesReady=${e.resourcesReady} hasFinished=${e.hasFinished}`);
            if (e.resourcesReady)
                this._resync();

            for (let override of this._overrides) {
                // console.log(`${this.name} notifying override ${override}`);
                let otherArea = this._areaManager.getAreaByName(override);
                if (otherArea) {
                    // console.log(`Resyncing ${otherArea.name}`);
                    otherArea._resync();
                }
            }
            this._triggerDateCorrectionUpdate();
        });

        this._areaManager.audioServer.state.$watch("volume", (volumes) => {
            // console.log("Volumes changed");
            this._updateResourceVolume();
        }, {
            deep: true,
            immediate: true
        });

        for (let resourceData of areaDefinitionPacket.resources || []) {
            let resource = new AudioResource(resourceData, this);
            this._resources.push(resource);
        }
        for (let resource of this._resources) {
            resource.state.$watch(() => {
                this._onResourceStateChanged(resource);
            }, () => {
            });
        }
        this.updateFilters()
    }

    updateFilters() {
        if (this.state.playing || this.state.playWhenReady)
            this.filters.forEach(filter => filter.update())
    }

    hasDescribableResources() {
        for (let resource of this._resources) {
            if (resource.describe() != null) {
                return true;
            }
        }
        return false;
    }

    cleanName() {
        return (this.displayName || this.name).replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase())
    }

    _triggerDateCorrectionUpdate() {
        if (!this.state.playing) {
            // TODO: Check if this actually matters
            // this._dateCorrection = this._areaManager.connectionManager.dateCorrection.value;
            // console.log("Updating date correction for area " + this.name + " to " + this.state._dateCorrection + " cause state " + this.state.playing);
        }
    }

    _onResourceStateChanged(resource: AudioResource) {
        let hasLoadedAllResource = this._resources.length > 0;
        for (let resource of this._resources) {
            if (!resource.state.ready) {
                hasLoadedAllResource = false;
                break;
            }
        }

        if (this.state.resourcesReady !== hasLoadedAllResource) {
            // console.log(`Loaded all resources for ${this.name}`);
            this._hasLoadedAllResource = hasLoadedAllResource;
            this.state.resourcesReady = hasLoadedAllResource;
        }

        this._resync();
    }

    _resync() {
        if (!this._hasLoadedAllResource)
            return;

        if (!this.state.playWhenReady) {
            return;
        }

        if (this._isSyncing)
            return;

        this._isSyncing = true;

        // console.log(`_resync`);

        let isOverridden = this._areaManager.isCurrentlyOverridden(this.name);
        if (isOverridden) {
            if (!this.state.isOverridden) {
                this.state.isOverridden = true;
                this._updatePlayingState();
            }
            this._isSyncing = false;
            if (this.state.hasFinished)
                this.state.hasFinished = false;
            return;
        } else {
            if (this.state.isOverridden) {
                this.state.isOverridden = false;
                this._updatePlayingState();
            }
        }

        let syncTime = this._sync + this.state._dateCorrection;
        let loop: number = 0;
        while (loop < 1000000) {
            let totalDuration = 0;
            for (let resource of this._resources) {
                let duration = resource.getDurationInMs();
                let now = new Date().getTime();
                if (syncTime + duration > now) {
                    resource.play();
                    resource.syncToMs(now - syncTime);

                    for (let otherResource of this._resources) {
                        if (otherResource != resource)
                            otherResource.pause();
                    }
                    this._isSyncing = false;
                    if (this.state.hasFinished)
                        this.state.hasFinished = false;
                    return;
                }
                syncTime += duration;
                totalDuration += duration;
            }
            if (totalDuration === 0) {
                this.state.playWhenReady = false;

                for (let resource of this._resources) {
                    resource.pause();
                }
                this._isSyncing = false;
                if (this.state.hasFinished)
                    this.state.hasFinished = false;
                return;
            }
            if (this._repeatType !== RepeatType.REPEAT_SEQUENCE) {
                // console.log(`Area has finished ${this.name}`);
                // let state = this.state.value;
                // state.playWhenReady = false;
                // this.state.next(state);

                for (let resource of this._resources) {
                    resource.pause();
                }

                this._isSyncing = false;
                this.state.hasFinished = true;
                return;
            }
            loop++;
        }
        this._isSyncing = false;
        if (!this.state.hasFinished) {
            this.state.hasFinished = true;
        }


        // for (let resource of this._resources) {
        //     resource.play();
        // }
    }

    setSync(newSync: number) {
        // console.log(`Synced area ${this.name} to ${newSync}`);
        this._sync = newSync;
        this._resync();
    }

    _updateResourceVolume() {
        let calculatedVolume = this._baseVolume * this._fadeMultiply * (this._areaManager.audioServer.state.volume.master.value / 100) * (this._areaManager.audioServer.state.volume.music.value / 100);
        // console.log(`Volume of area ${this.name} is now ${calculatedVolume}`);

        (this.startNode as GainNode).gain!!.value = calculatedVolume
        // for (let resource of this._resources) {
        //     resource.setVolume(calculatedVolume);
        // }

        if (calculatedVolume === 0) {
            for (let resource of this._resources) {
                resource.pause();
            }
        }
    }

    _updatePlayingState() {
        // if (!this._hasLoadedAllResource)
        //     return;

        // console.log(`update playing state ${this.name}`);

        if (this.state.playWhenReady && !this.state.isOverridden && !this.state.playing) {
            // console.log('Playing');
            this.state.playing = true;

            let fadeDuration = this._fadeTime * (1 - this._fadeMultiply) * 2;
            this._resync();
            this._fadeAudioTo(1.0, fadeDuration);
        } else if ((!this.state.playWhenReady || this.state.isOverridden) && this.state.playing) {
            // console.log('Pausing');
            this.state.playing = false;

            let fadeDuration = this._fadeTime * (1 - (1 - this._fadeMultiply)) * 2;
            this._fadeAudioTo(0.0, fadeDuration);
        }
    }

    _fadeAudioTo(fadeTo: number, duration: number) {
        if (this._fadeTask != null)
            clearInterval(this._fadeTask);
        let fadeFrom = this._fadeMultiply;
        if (fadeTo === fadeFrom) {
            return;
        }
        let startTime = new Date().getTime();
        let endTime = new Date().getTime() + duration;
        let valueDelta = fadeTo - fadeFrom;
        this._fadeTask = setInterval(() => {
            let now = new Date().getTime();
            if (now >= endTime) {
                this._fadeMultiply = fadeTo;
                if (this._fadeTask != null)
                    clearInterval(this._fadeTask);
                // console.log("Fade finished")
            } else {
                let progress = (now - startTime) / duration;
                let newValue = fadeTo + ((1 - progress) * -valueDelta);
                this._fadeMultiply = newValue > 1 ? 1 : newValue < 0 ? 0 : newValue;
                // console.log(`Fading ${progress} from=${fadeFrom} to=${fadeTo} = ${this._fadeMultiply}`)
            }
            this._updateResourceVolume();
        }, 10);
    }

    isPlayWhenReady() {
        return this.state.playWhenReady;
    }

    isPlayingOrPlayWhenReady() {
        return this.state.playWhenReady || this.state.playing;
    }

    play() {
        if (this.state.playWhenReady)
            return;

        this.state.playWhenReady = true;
        this._updatePlayingState();
        this._areaManager.audioServer.send(new PacketDisplayAreaEnter().set(this._areaDefinitionPacket).asJson());
    }

    pause() {
        if (!this.state.playWhenReady)
            return;

        this.state.playWhenReady = false;
        this._updatePlayingState();
    }

    clean() {
        this.filters.forEach(item => item.release())
        for (let resource of this._resources) {
            resource.clean();
        }
        if (this._fadeTask != null)
            clearInterval(this._fadeTask);
    }
}