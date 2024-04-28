export const PacketID = {
    LOGIN: 1,
    KICK: 2,
    CLIENT_ACCEPTED: 3,
    AREA_DEFINITION: 4,
    AREA_STATE: 5,
    SYNC: 6,
    KEY_VALUE: 7,
    PING: 8,
    VOLUME: 13,
    RELOAD: 14,
    LOCATION_UPDATE: 15,
    TRAIN_DEFINITION: 16,
    TRAIN_POSITION_UPDATE: 17,

    DISPLAY_AREA_ENTER: 18,

    OPERATOR_DEFINITION: 19,
    OPERATOR_CONTROL_UPDATE: 20,
    OPERATOR_SLOT_UPDATE: 21,
    OPERATOR_CONTROL_CLICK: 22,
    OPERATOR_RIDE_UPDATE: 34,

    PARK_PHOTO: 23,

    PLAYER_LOCATIONS: 27,

    ADD_MAP_LAYERS: 28,
    REMOVE_MAP_LAYERS: 35,

    MARKER_ADD: 36,
    MARKER_REMOVE: 37,

    POLYGON_OVERLAY_ADD: 38,
    POLYGON_OVERLAY_REMOVE: 39,

    SPATIAL_AUDIO_DEFINITION: 29,
    SPATIAL_AUDIO_UPDATE: 30,
    SPATIAL_AUDIO_REMOVE: 31,

    AREA_REMOVE: 32,
    BATCH_PACKET: 33
};

export const Protocol = {
    protocolVersion: 14
};

interface Packet {
    fromJson(obj: object): this

    asJson(): string
}

export class PacketLogin implements Packet {
    readonly version: number = Protocol.protocolVersion;
    uuid: string = "";
    auth: string = "";

    set(uuid: string, auth: string): this {
        this.uuid = uuid;
        this.auth = auth;
        return this;
    }

    fromJson(obj: any) {
        this.uuid = obj.uuid;
        this.auth = obj.auth;
        return this;
    }

    asJson(): string {
        return JSON.stringify({
            id: PacketID.LOGIN,
            version: this.version,
            uuid: this.uuid,
            auth: this.auth
        });
    }
}

export class PacketKick implements Packet {
    message: string = "";
    reason: string = "";

    set(message: string, reason: string): this {
        this.message = message;
        this.reason = reason;
        return this;
    }

    fromJson(obj: any): this {
        this.message = obj.message;
        this.reason = obj.reason;
        return this;
    }

    asJson(): string {
        return JSON.stringify({id: PacketID.KICK, message: this.message, reason: this.reason});
    }
}

export class PacketClientAccepted implements Packet {
    servername: string = "";
    sendTime: number = 0;
    uuid: string | null = null;

    set(servername: string): this {
        this.servername = servername;
        return this;
    }

    fromJson(obj: any): this {
        this.servername = obj.servername;
        this.sendTime = obj.send_time;
        this.uuid = obj.uuid;
        return this;
    }

    asJson(): string {
        return JSON.stringify({id: PacketID.CLIENT_ACCEPTED, servername: this.servername});
    }
}

export class PacketAreaDefinition implements Packet {
    areaId = -1;
    name: string | null = null;
    displayName: string | null = null;
    resources: any[] = [];
    overrides: string[] = [];
    fadeTime = 500;
    sync = 0;
    volume = 1.0;
    repeatType = null;
    filters: any[] = [];

    fromJson(obj: any): this {
        this.areaId = obj.area_id;
        this.name = obj.name;
        this.displayName = obj.display_name;
        this.resources = obj.resources;
        this.overrides = obj.overrides;
        this.fadeTime = obj.fade_time;
        this.sync = obj.sync;
        this.volume = obj.volume;
        this.repeatType = obj.repeat_type;
        this.filters = obj.filters;
        return this;
    }

    asJson(): string {
        return ""
    }
}

export class PacketAreaRemove implements Packet {
    areaId: number | null = null;

    fromJson(obj: any): this {
        this.areaId = obj.area_id;
        return this;
    }

    asJson(): string {
        return ""
    }
}

export class PacketAreaState implements Packet {
    areaId = -1;
    playing = false;

    fromJson(obj: any): this {
        this.areaId = obj.area_id;
        this.playing = obj.playing;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketAreaSync implements Packet {
    areaId = -1;
    sync = 0;

    fromJson(obj: any): this {
        this.areaId = obj.area_id;
        this.sync = obj.sync;
        return this;
    }

    asJson(): string {
        return "";
    }

}

export class PacketKeyValue implements Packet {
    key: string | null = null;
    value: string | null = null;

    fromJson(obj: any): this {
        this.key = obj.key;
        this.value = obj.value;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketPing implements Packet {
    sendTime: number = 0;

    set(sendTime: number) {
        this.sendTime = sendTime;
        return this;
    }

    fromJson(obj: any): this {
        this.sendTime = obj.send_time;
        return this;
    }

    asJson(): string {
        return JSON.stringify({id: PacketID.PING, send_time: this.sendTime});
    }
}

export class PacketVolume implements Packet {
    volume: number | null = null;
    type: string | null = null;

    set(volume: number, type: string) {
        this.volume = volume;
        this.type = type;
        return this;
    }

    fromJson(obj: any): this {
        this.volume = obj.volume;
        this.type = obj.type;
        return this;
    }

    asJson(): string {
        return JSON.stringify({id: PacketID.VOLUME, volume: this.volume, type: this.type});
    }
}

export class PacketLocationUpdate implements Packet {
    x: number | null = null;
    y: number | null = null;
    z: number | null = null;
    yaw: number | null = null;
    pitch: number | null = null;

    fromJson(obj: any): this {
        this.x = obj.x;
        this.y = obj.y;
        this.z = obj.z;
        this.yaw = obj.yaw;
        this.pitch = obj.pitch;
        return this;
    }

    asJson(): string {
        return JSON.stringify({
            id: PacketID.LOCATION_UPDATE,
            x: this.x,
            y: this.y,
            z: this.z,
            yaw: this.yaw,
            pitch: this.pitch
        });
    }
}

export class PacketDisplayAreaEnter implements Packet {
    name: string | null = null;

    set(area: any) {
        this.name = area == null ? null : area.name;
        return this;
    }

    fromJson(obj: object): this {
        return this;
    }

    asJson(): string {
        return JSON.stringify({
            id: PacketID.DISPLAY_AREA_ENTER,
            name: this.name
        });
    }
}

export class PacketOperatorDefinition implements Packet {
    rides: any[] = [];

    fromJson(obj: any): this {
        this.rides = obj.rides;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketOperatorControlUpdate implements Packet {
    control: any | null = null;

    fromJson(obj: any): this {
        this.control = obj.control_model;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketOperatorSlotUpdate implements Packet {
    data: any | null = null;

    fromJson(obj: any): this {
        this.data = obj.data;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketOperatorControlClick implements Packet {
    rideId: string | null = null;
    controlId: string | null = null;

    set(rideId: string, controlId: string) {
        this.rideId = rideId;
        this.controlId = controlId;
        return this;
    }

    asJson(): string {
        return JSON.stringify({
            id: PacketID.OPERATOR_CONTROL_CLICK,
            ride_id: this.rideId,
            control_id: this.controlId
        });
    }

    fromJson(obj: object): this {
        return this;
    }
}

export class PacketOperatorRideUpdate implements Packet {
    ride: any | null = null;

    fromJson(obj: any): this {
        this.ride = obj.ride;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketParkPhoto implements Packet {
    data: string | null = null; // base64
    url: string | null = null; // url
    persons: string[] = [];
    name: string | null = null;
    time: number | null = null;
    type: string | null = null;

    fromJson(obj: any): this {
        this.data = obj.data;
        this.url = obj.url;
        this.persons = obj.persons;
        this.name = obj.name;
        this.time = obj.time;
        this.type = obj.type;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketPlayerLocations implements Packet {
    players = [];

    fromJson(obj: any): this {
        this.players = obj.players;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketMapLayersAdd implements Packet {
    mode: string | null = null;
    group: string | null = null;
    layers: MapLayer[] = []

    fromJson(obj: any): this {
        this.mode = obj.mode;
        this.layers = obj.layers ?? [];
        this.group = obj.group ?? null;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class MapLayer {
    id!: string;
    group?: string;
    base64?: string;
    url?: string;
    x!: number;
    z!: number;
    width!: number;
    height!: number;
    zIndex!: number;
    visibilityAreas?: Area[]
}

export class Area {
    xMin!: number;
    yMin!: number;
    zMin!: number;
    xMax!: number;
    yMax!: number;
    zMax!: number;
}

export interface PacketPoint {
    x: number
    y: number
}

export class PacketMapLayersRemove implements Packet {
    remove: string[] = [];
    group: string | null = null;

    fromJson(obj: any): this {
        this.remove = obj.remove ?? [];
        this.group = obj.group ?? null;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketMarkersAdd implements Packet {
    mode: string | null = null;
    group: string | null = null;
    markers: MapMarker[] = []

    fromJson(obj: any): this {
        this.mode = obj.mode;
        this.markers = obj.markers ?? [];
        this.group = obj.group ?? null;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class MapMarker {
    id!: string;
    type?: string;
    className?: string;
    group?: string;
    popupName?: string;
    base64?: string;
    url?: string;
    x!: number;
    z!: number;
    zIndex!: number;
    size?: PacketPoint;
    anchor?: PacketPoint;
    popupAnchor?: PacketPoint;
}

export class PacketMarkersRemove implements Packet {
    remove: string[] = [];
    group: string | null = null;

    fromJson(obj: any): this {
        this.remove = obj.remove ?? [];
        this.group = obj.group ?? null;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketPolygonOverlayAdd implements Packet {
    mode: string | null = null;
    group: string | null = null;
    polygons: MapPolygonOverlay[] = []

    fromJson(obj: any): this {
        this.mode = obj.mode;
        this.polygons = obj.polygons ?? [];
        this.group = obj.group ?? null;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class MapPolygonOverlay {
    id!: string;
    type!: string;
    title?: string;
    group?: string;
    stroke!: boolean;
    strokeColor!: string;

    fill!: boolean;
    fillColor!: string;
    fillOpacity!: number
    fillRule!: string

    opacity!: number

    className!: string
    interactive!: boolean

    min?: Vector
    max?: Vector
}

export class PacketPolygonOverlayRemove implements Packet {
    remove: string[] = [];
    group: string | null = null;

    fromJson(obj: any): this {
        this.remove = obj.remove ?? [];
        this.group = obj.group ?? null;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketSpatialAudioDefinition implements Packet {
    audioId: number | null = null;
    distanceModel: string | null = null;
    panningModel: string | null = null;
    state: PacketSpatialAudioUpdate | null = null;
    soundUrl: string | null = null;

    fromJson(obj: any): this {
        this.audioId = obj.audio_id;
        this.distanceModel = obj.distance_model;
        this.panningModel = obj.panning_model;
        this.soundUrl = obj.sound_url;
        this.state = new PacketSpatialAudioUpdate().fromJson(obj.state);
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketSpatialAudioUpdate implements Packet {
    audioId: number | null = null;
    x: number | null = null;
    y: number | null = null;
    z: number | null = null;
    orientationX: number | null = null;
    orientationY: number | null = null;
    orientationZ: number | null = null;
    coneInnerAngle: number | null = null;
    coneOuterAngle: number | null = null;
    coneOuterGain: number | null = null;
    maxDistance: number | null = null;
    refDistance: number | null = null;
    rolloffFactor: number | null = null;
    volume: number | null = null;
    rate: number | null = null;
    playing: boolean | null = null;
    loop: boolean | null = null;
    sync: number | null = null;
    fadeOutStartDistance: number | null = null;
    fadeOutEndDistance: number | null = null;

    fromJson(obj: any): this {
        this.audioId = obj.audio_id;
        this.x = obj.x;
        this.y = obj.y;
        this.z = obj.z;
        this.orientationX = obj.orientation_x;
        this.orientationY = obj.orientation_y;
        this.orientationZ = obj.orientation_z;
        this.coneInnerAngle = obj.cone_inner_angle;
        this.coneOuterAngle = obj.cone_outer_angle;
        this.coneOuterGain = obj.cone_outer_gain;
        this.maxDistance = obj.max_distance;
        this.refDistance = obj.ref_distance;
        this.rolloffFactor = obj.rolloff_factor;
        this.volume = obj.volume;
        this.rate = obj.rate;
        this.playing = obj.playing;
        this.loop = obj.loop;
        this.sync = obj.sync;
        this.fadeOutStartDistance = obj.fade_out_start_distance;
        this.fadeOutEndDistance = obj.fade_out_end_distance;
        return this;
    }

    asJson(): string {
        return "";
    }
}

export class PacketSpatialAudioRemove implements Packet {
    audioId = null;

    fromJson(obj: any): this {
        this.audioId = obj.audio_id;
        return this;
    }

    asJson(): string {
        return "";
    }
}