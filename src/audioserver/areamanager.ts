import AudioArea from "@/audioserver/audioarea";
import {PacketAreaDefinition, PacketAreaState, PacketAreaSync, PacketID} from "@/audioserver/packets";
import Vue from "vue";
import {AudioServer, AudioServerPacketEvent} from "@/audioserver/audioserver";

export default class AreaManager {
    audioServer: AudioServer;
    _areas: AudioArea[];
    state = new Vue({
        data: {
            areaGetter: () => []
        },
        computed: {
            _dateCorrection: function () {
                return this.$audioServer.state.dateCorrection;
            }
        }
    });

    constructor(audioServer: AudioServer) {
        this.audioServer = audioServer;
        this._areas = [];

        // this.data = new Vue({
        //     data: {
        //         areas: []
        //     }
        // });

        audioServer.state.$on("packet", (packetEvent: AudioServerPacketEvent) => {
            if (packetEvent.isHandled === true) return;
            let packetData = packetEvent.data;
            if (packetEvent.id === PacketID.AREA_DEFINITION) {
                packetEvent.isHandled = true;
                let packet = new PacketAreaDefinition().fromJson(packetData);
                this._addAreaFromPacket(packet);
            } else if (packetEvent.id === PacketID.AREA_STATE) {
                packetEvent.isHandled = true;
                let packet = new PacketAreaState().fromJson(packetData);
                this._setAreaState(packet);
            } else if (packetEvent.id === PacketID.SYNC) {
                packetEvent.isHandled = true;
                let packet = new PacketAreaSync().fromJson(packetData);
                this._syncAreaFromPacket(packet);
            } else if (packetEvent.id === PacketID.RELOAD) {
                packetEvent.isHandled = true;
                this._clean();
            }

            // if (packetEvent.isHandled === true) {
            //     console.log(packetEvent);
            // }
        });

        audioServer.state.$watch("isConnected", (isConnected: boolean) => {
            if (!isConnected)
                this._clean();
        });

        // @ts-ignore
        window.debugMessage = () => {
            return this.debugMessage();
        };
    }

    updateFilters() {
        this._areas.forEach(area => area.updateFilters())
    }

    debugMessage() {
        // console.log(this._areas);
        let areas = [];
        for (let area of this._areas) {
            let areaObject: any = {};
            areaObject.name = area.name;
            areaObject.sync = area._sync;
            areaObject.syncing = area._isSyncing;
            areaObject.state = area.state;

            let resources = [];
            for (let resource of area._resources) {
                let resourceObject: any = {};
                let splittedUrl = resource.resource.location.split("/");
                resourceObject.resourceName = splittedUrl[splittedUrl.length - 1];
                resourceObject.state = resource.state;

                let audio = resource.audio;
                let audioObject: any = {};

                audioObject.currentTime = audio?.currentTime;
                audioObject.duration = audio?.duration;
                audioObject.ended = audio?.ended;
                audioObject.error = audio?.error;
                audioObject.buffered = audio?.buffered;
                audioObject.paused = audio?.paused;
                audioObject.networkState = audio?.networkState;
                audioObject.readyState = audio?.readyState;
                audioObject.seeking = audio?.seeking;
                audioObject.volume = audio?.volume;

                resourceObject.audio = audioObject;
                resources.push(resourceObject);

                // console.log(resource.audio);
            }
            areaObject.resources = resources;

            areas.push(areaObject);
        }
        return areas;
    }

    isCurrentlyOverridden(areaName: string) {
        for (let area of this._areas) {
            if (area.state.playWhenReady && !area.state.hasFinished && area.name !== areaName &&
                (area._overrides.indexOf(areaName) >= 0 || area._overrides.indexOf("*") >= 0)) {
                return true;
            }
        }
        return false;
    }

    getAreaByName(name: string) {
        for (let area of this._areas) {
            if (area.name === name) {
                return area;
            }
        }
        return null;
    }

    _clean() {
        for (let area of this._areas) {
            area.clean();
        }
        this._areas = [];
        this.state.$data.areaGetter = () => this._areas;
    }

    _syncAreaFromPacket(syncPacket: PacketAreaSync) {
        // console.log(`Syncing area ${syncPacket.areaId}`);
        for (let area of this._areas) {
            if (area.areaId === syncPacket.areaId) {
                area.setSync(syncPacket.sync);
                return;
            }
        }
    }

    _addAreaFromPacket(areaDefinitionPacket: PacketAreaDefinition) {
        // console.log(`Adding area ${areaDefinitionPacket.name} with id ${areaDefinitionPacket.areaId}`);
        for (let area of this._areas) {
            if (area.name === areaDefinitionPacket.name) {
                console.warn(`Area ${areaDefinitionPacket.name} send twice`);
                return;
            }
        }
        let area = new AudioArea(areaDefinitionPacket, this);
        this._areas.push(area);
        this.state.$data.areaGetter = () => this._areas;
    }

    _setAreaState(areaStatePacket: PacketAreaState) {
        // console.log(`Area state update for ${areaStatePacket.areaId} with playing ${areaStatePacket.playing}`);
        for (let area of this._areas) {
            if (area.areaId === areaStatePacket.areaId) {
                // console.log(`Area state of ${area.name} is playing=${areaStatePacket.playing}`);
                if (areaStatePacket.playing) {
                    area.play();
                } else {
                    area.pause();
                }
                return;
            }
        }
        console.warn(`Area state received for ${areaStatePacket.areaId} which doesn't exists!`);
    }
}