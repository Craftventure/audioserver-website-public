import {
    PacketID,
    PacketSpatialAudioDefinition,
    PacketSpatialAudioRemove,
    PacketSpatialAudioUpdate
} from "@/audioserver/packets";
import Vue from "vue";
import SpatialAudio from "@/audioserver/spatialaudio";
import {AudioServer, AudioServerPacketEvent} from "@/audioserver/audioserver";
import {Howler} from "howler";

export default class SpatialAudioManager {
    _audios: Map<number, SpatialAudio> = new Map();
    startTime = new Date().getTime();

    state = new Vue({
        data: {},
        computed: {
            location: function () {
                return this.$audioServer.managedData.location;
            },
            volume: function () {
                return this.$audioServer.state.volume;
            }
        }
    });

    constructor(audioServer: AudioServer) {

        audioServer.state.$on("packet", (packetEvent: AudioServerPacketEvent) => {
            if (packetEvent.isHandled === true) return;
            let packetData = packetEvent.data;
            if (packetEvent.id === PacketID.SPATIAL_AUDIO_DEFINITION) {
                packetEvent.isHandled = true;
                let packet = new PacketSpatialAudioDefinition().fromJson(packetData);
                // if (packet.soundUrl == "/sound/fenghuang/lift.mp3")
                this._createAudio(packet);
            } else if (packetEvent.id === PacketID.SPATIAL_AUDIO_UPDATE) {
                packetEvent.isHandled = true;
                let packet = new PacketSpatialAudioUpdate().fromJson(packetData);
                this._updateState(packet);
            } else if (packetEvent.id === PacketID.SPATIAL_AUDIO_REMOVE) {
                packetEvent.isHandled = true;
                let packet = new PacketSpatialAudioRemove().fromJson(packetData);
                this._removeAudio(packet);
            } else if (packetEvent.id === PacketID.RELOAD) {
                packetEvent.isHandled = true;
                this._clean();
            }

            // if (packetEvent.isHandled === true) {
            //     console.log(packetEvent);
            // }
        });

        audioServer.state.$watch("isConnected", (isConnected) => {
            if (!isConnected)
                this._clean();
        });

        this.state.$watch("location", (location) => {
            if (location != null) {
                // eslint-disable-next-line no-undef
                Howler.pos(location.x, location.y, location.z);

                let pitch = ((location.pitch) * Math.PI) / 180;
                let yaw = (((location.yaw) * Math.PI) / 180);

                let xz = Math.cos(pitch);
                let x = -xz * Math.sin(yaw);
                let y = -Math.sin(pitch);
                let z = xz * Math.cos(yaw);

                // eslint-disable-next-line no-undef
                Howler.orientation(x, y, z, 0, 1, 0);

                this._audios.forEach(item => item._updateVolume());
            }
        });

        this.state.$watch("volume", (volume) => {
            this._audios.forEach(item => item.setVolume(this._calculateCurrentAudioLevel()));
        }, {deep: true, immediate: true});

        // window._audios = this._audios;
    }

    _calculateCurrentAudioLevel() {
        // @ts-ignore
        return (this.state.volume.effect.value / 100) * (this.state.volume.master.value / 100);
    }

    _createAudio(packet: PacketSpatialAudioDefinition) {
        // console.log(packet);
        let audio = this._audios.get(packet.audioId!!);
        if (audio != null) {
            // console.warn(`Received Spatial audio with id ${packet.audioId} that already exists!`);
            this._updateState(packet.state!!);
            return;
        }
        audio = new SpatialAudio(this, packet);
        audio.setVolume(this._calculateCurrentAudioLevel());
        this._audios.set(packet.audioId!!, audio);
    }

    _updateState(packet: PacketSpatialAudioUpdate) {
        // console.log(packet);
        let audio = this._audios.get(packet.audioId!!);
        if (audio != null) audio.update(packet);
    }

    _removeAudio(packet: PacketSpatialAudioRemove) {
        // console.log(packet);
        let audio = this._audios.get(packet.audioId!!);
        if (audio != null) audio.release();
        this._audios.delete(packet.audioId!!);
        // console.log(`Removed ${packet.audioId} ${this._audios[packet.audioId]}`)
    }

    _clean() {
        // console.log("Clean");
        // console.log(this._audios);
        this._audios.forEach(item => item.release())
        this._audios.clear();
    }
}