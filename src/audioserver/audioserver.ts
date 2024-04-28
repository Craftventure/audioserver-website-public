import Vue from "vue";
import {
    PacketClientAccepted,
    PacketID,
    PacketKick,
    PacketLocationUpdate,
    PacketLogin,
    PacketParkPhoto,
    PacketPing,
    PacketPlayerLocations,
    PacketVolume
} from "@/audioserver/packets";
import AreaManager from "@/audioserver/areamanager";
//wss://audiotunnel.craftventure.net:8887
// const store = new Vuex.Store({});
//
export class AudioServer {
    _ws: WebSocket | null = null;
    state = new Vue({
        data: {
            isVerified: false,
            isConnected: false,
            isConnecting: false,
            dateCorrection: 0,
            url: "wss://audiotunnel.craftventure.net:8887",
            username: null as string | null,
            authCode: null as string | null,
            verifiedUuid: null as string | null,
            disconnectedMessage: null as string | null,
            lastSendTime: null as number | null,
            volume: {
                master: {
                    name: "Master",
                    value: 50
                },
                music: {
                    name: "Music",
                    value: 100
                },
                effect: {
                    name: "Effects",
                    value: 100
                },
                ambient: {
                    name: "Ambient",
                    value: 100,
                    visible: false
                }
            }
        }
    });

    managedData = new Vue({
        data: {
            players: [] as {
                x?: number,
                y?: number,
                z?: number,
                yaw?: number,
                pitch?: number,
                uuid?: string
            }[],
            location: null as {
                x?: number,
                y?: number,
                z?: number,
                yaw?: number,
                pitch?: number
            } | null,
            parkPhotos: [] as PacketParkPhoto[]
        }
    });
    _heartBeatInterval?: number;
// @ts-ignore
    audioContext = new (window.AudioContext ?? window.webkitAudioContext!!)()

    constructor() {
        this.managedData.$watch("location", (location) => {
            // console.log("Location updated", location)
            this.managedData.$areaManager.updateFilters()
        })

        for (let volumeType in this.state.volume) {
            this.state.$watch(`volume.${volumeType}.value`, (volume) => {
                this.send(new PacketVolume().set(volume / 100, volumeType).asJson());
            });
        }

        this.state.$watch("volume", (volume) => {

        });

        // var sound = new Howl({
        //     src: ['/sound/fenrir/brake.mp3'],
        //     autoplay: true,
        //     volume: 1.0,
        //     loop:true
        // });
        // sound.play();
        // sound.pos(0, 0, 30);
        // sound.orientation(90.0, 0, 0);
        // sound.pannerAttr({
        //     coneInnerAngle: 360.0,
        //     coneOuterGain: 0,
        //     rolloffFactor: 1.0,
        //     distanceModel: "inverse"
        // });
        // sound.fade(1, 0, 1000, null);
    }

    _resetManagedData() {
        this.managedData.players = [];
        this.managedData.location = null;
        this.managedData.parkPhotos = [];
    }

    _resetState() {
        this._resetManagedData();
        this.state.dateCorrection = 0;
        this.state.isConnecting = false;
        this.state.isVerified = false;
        this.state.lastSendTime = null;
        this.state.verifiedUuid = null;
    }

    connect(username: string, authCode: string, server: string) {
        if (this.state.isConnected) return;
        this._resetState();

        if (this._ws != null) {
            this._ws.close();
            this._ws = null;
        }

        // console.log(`Connecting as ${username} ${authCode}`);

        this.state.disconnectedMessage = null;
        this.state.username = username;
        this.state.authCode = authCode;

        this.state.isConnecting = true;
        this._ws = new WebSocket(server || this.state.url || "wss://audiotunnel.craftventure.net:8887");
        this._ws.onopen = () => {
            // console.log("Open");
            this.state.isConnected = true;
            this._onOpen();
        };
        this._ws.onmessage = (e) => {
            // console.log("Message");
            this._onMessage(e);
        };
        this._ws.onerror = (e) => {
            // console.log("Error");
            this._onError(e);
        };
        this._ws.onclose = (e) => {
            // console.log("Closed");
            this.state.isConnected = false;
            this._onClose(e);
        };
    }

    send(json: string) {
        if (this._ws != null) {
            // console.log(`Sending ${json}`);
            this._ws.send(json);
        }
    }

    _sendPing() {
        this.state.lastSendTime = new Date().getTime();
        this.send(new PacketPing().set(this.state.lastSendTime!!).asJson());
    }

    _onOpen() {
        this.send(new PacketLogin().set(this.state.username!!, this.state.authCode!!).asJson());

        this._heartBeatInterval = setInterval(() => {
            this._sendPing();
        }, 5000);
    }

    _onMessage(message: MessageEvent) {
        // console.log(message);
        this._handlePacket(message);
    }

    _handlePacket(message: MessageEvent) {
        try {
            let data = JSON.parse(message.data);
            if (typeof (data.id) !== 'undefined') {
                if (data.id === PacketID.KICK) {
                    let packet = new PacketKick().fromJson(data);
                    this.state.disconnectedMessage = packet.message;
                    this._ws?.close();
                } else if (data.id === PacketID.CLIENT_ACCEPTED) {
                    this.state.isConnecting = false;
                    let packet = new PacketClientAccepted().fromJson(data);
                    this.state.verifiedUuid = packet.uuid;

                    // if (this.state.lastSendTime) {
                    // let difference = new Date().getTime() - this.state.lastSendTime;
                    this.state.dateCorrection = new Date().getTime() - (packet.sendTime);// - (difference / 2));
                    // }
                    this.state.isVerified = true;
                } else if (data.id === PacketID.KEY_VALUE) {
                    //
                    // let packet = new PacketKeyValue().fromJson(data);
                    // if(packet.key=="crew"){
                    //     if(packet.)
                    // }
                } else if (data.id === PacketID.PING) {
                    let packet = new PacketPing().fromJson(data);

                    // if (this.state.lastSendTime) {
                    //     let difference = new Date().getTime() - this.state.lastSendTime;
                    this.state.dateCorrection = new Date().getTime() - packet.sendTime;//(packet.sendTime - (difference / 2));
                    // }
                } else if (data.id === PacketID.LOCATION_UPDATE) {
                    let packet = new PacketLocationUpdate().fromJson(data);
                    this.managedData.location = {
                        x: packet.x!!,
                        y: packet.y!!,
                        z: packet.z!!,
                        yaw: packet.yaw!!,
                        pitch: packet.pitch!!
                    };
                    let players = this.managedData.players;
                    if (players != null) {
                        for (let player of players) {
                            if (player.uuid != null && player.uuid === this.state.verifiedUuid) {
                                player.x = packet.x!!;
                                player.y = packet.y!!;
                                player.z = packet.z!!;
                                break;
                            }
                        }
                    }
                } else if (data.id === PacketID.PARK_PHOTO) {
                    let packet = new PacketParkPhoto().fromJson(data);
                    this.managedData.parkPhotos.push(packet);
                } else if (data.id === PacketID.VOLUME) {
                    let packet = new PacketVolume().fromJson(data);

                    // console.log(packet);

                    if (packet.type != null) {
                        try {
                            let volume = this.state.volume as { [index: string]: any }
                            volume[packet.type].value = packet.volume!! * 100;
                        } catch (e) {
                            //
                        }
                    } else {
                        this.state.volume.master.value = packet.volume!! * 100;
                    }
                } else if (data.id === PacketID.PLAYER_LOCATIONS) {
                    let packet = new PacketPlayerLocations().fromJson(data);
                    this.managedData.players = packet.players;
                } else {
                    let event = new AudioServerPacketEvent(data, message.data);
                    this.state.$emit("packet", event);
                    try {
                        if (event.isHandled === false) {
                            var name = null;
                            for (let property in PacketID) {
                                if ((PacketID as { [index: string]: any })[property] == data.id) {
                                    name = property;
                                    break;
                                }
                            }
                            console.warn(`Packet received with id ${data.id} (name=${name ?? "UNKNOWN"}) that went unhandled by any extensions`);
                            // console.log(data);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            } else {
                this._ws?.close();
                console.error(`Packet has no ID: ${JSON.stringify(message.data)}`);
                this.state.disconnectedMessage = "Packet received that has no ID";
            }
        } catch (e) {
            console.error(e);
            this._ws?.close();
            this.state.disconnectedMessage = "Failed to parse received packet";
        }
    }

    _onError(error: any) {
        this.state.disconnectedMessage = `An error occured somewhere. Blame Joeywp for not handling this correctly.`;
    }

    _onClose(event: any) {
        clearInterval(this._heartBeatInterval);
        this._resetState();
        this._ws = null;
    }

    disconnect() {
        if (this._ws != null) {
            this._ws.close();
        }
    }
}

declare module 'vue/types/vue' {
    interface Vue {
        $audioServer: AudioServer
        $areaManager: AreaManager
    }
}

export class AudioServerPacketEvent {
    isHandled: boolean
    id: number
    data: any
    rawData: string

    constructor(data: any, rawData: string) {
        this.isHandled = false;
        this.id = data.id;
        this.data = data;
        this.rawData = rawData;
    }
}

const audioServer = new AudioServer();
export default audioServer;