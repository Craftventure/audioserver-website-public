import Vue from "vue";
import {
    PacketID,
    PacketOperatorControlUpdate,
    PacketOperatorDefinition,
    PacketOperatorRideUpdate,
    PacketOperatorSlotUpdate
} from "@/audioserver/packets";
import {AudioServer, AudioServerPacketEvent} from "@/audioserver/audioserver";

export default class OperatorManager {
    state = new Vue({
        data: {
            rides: [] as OperableRide[]
        },
        computed: {}
    });

    constructor(audioServer: AudioServer) {
        audioServer.state.$watch("isConnected", (isConnected: boolean) => {
            if (!isConnected)
                this._clean();
        });

        audioServer.state.$on("packet", (packetEvent: AudioServerPacketEvent) => {
            if (packetEvent.isHandled === true) return;
            let packetData = packetEvent.data;
            if (packetEvent.id === PacketID.OPERATOR_DEFINITION) {
                packetEvent.isHandled = true;
                let packet = new PacketOperatorDefinition().fromJson(packetData);
                this._addDefinitions(packet);
            } else if (packetEvent.id === PacketID.OPERATOR_CONTROL_UPDATE) {
                packetEvent.isHandled = true;
                let packet = new PacketOperatorControlUpdate().fromJson(packetData);
                this._updateControl(packet);
            } else if (packetEvent.id === PacketID.OPERATOR_RIDE_UPDATE) {
                packetEvent.isHandled = true;
                // console.log(packetData);
                let packet = new PacketOperatorRideUpdate().fromJson(packetData);
                this._updateRide(packet);
            } else if (packetEvent.id === PacketID.OPERATOR_SLOT_UPDATE) {
                packetEvent.isHandled = true;
                let packet = new PacketOperatorSlotUpdate().fromJson(packetData);
                this._updateSlot(packet);
            }

            // if (packetEvent.isHandled === true) {
            //     console.log(packetEvent);
            // }
        });
    }

    _getRideById(id: string) {
        for (let ride of this.state.rides) {
            if (ride.id === id) {
                return ride;
            }
        }
        return null;
    }

    _addDefinitions(packet: PacketOperatorDefinition) {
        // console.log(packet);
        for (let rideData of packet.rides) {
            let ride = new OperableRide(rideData);
            this.state.rides.push(ride);

            // console.log(this._getRideById(packet.id));
        }
    }

    _updateSlot(packet: PacketOperatorSlotUpdate) {
        // console.log(packet);
        let ride = this._getRideById(packet.data.ride_id);
        // console.log(packet.data.ride_id);
        if (ride != null) {
            ride.updateSlot(packet);
        }
    }

    _updateControl(packet: PacketOperatorControlUpdate) {
        // console.log(packet);
        let ride = this._getRideById(packet.control.ride_id);
        // console.log(packet.control.ride_id);
        if (ride != null) {
            ride.updateControl(packet);
        }
    }

    _updateRide(packet: PacketOperatorRideUpdate) {
        // console.log(packet);
        let ride = this._getRideById(packet.ride.id);
        // console.log(packet.control.ride_id);
        if (ride != null) {
            ride.update(packet);
        }
    }

    _clean() {
        this.state.rides.splice(0, this.state.rides.length);
    }
}

export class OperableRide {
    id: string
    state = new Vue({
        data: {
            controls: [] as OperatorControl[],
            name: "",
            operatorSlots: [] as OperatorSlot[],
            forceDisplay: false
        }
    });

    constructor(ride: any) {
        let controls = [];
        for (let controlData of ride.controls) {
            controls.push(new OperatorControl(this, controlData));
        }
        controls = controls.sort(function (a: any, b: any) {
            let valA = a.sort;
            let valB = b.sort;
            // console.log(`${valA} vs ${valB} == ${valA === valB}`);
            if (valA === valB) return 0;
            if (valA == null) return -1;
            if (valB == null) return 1;
            // console.log(`${(valA < valB) ? -1 : (valA > valB) ? 1 : 0}`);
            return (valA < valB) ? -1 : (valA > valB) ? 1 : 0;
        });

        controls = controls.sort(function (a: any, b: any) {
            let valA = a.group;
            let valB = b.group;
            // console.log(`${valA} vs ${valB} == ${valA === valB}`);
            if (valA === valB) return 0;
            if (valA == null) return -1;
            if (valB == null) return 1;
            // console.log(`${(valA < valB) ? -1 : (valA > valB) ? 1 : 0}`);
            return (valA < valB) ? -1 : (valA > valB) ? 1 : 0;
        });

        let slots = [];
        for (let slotData of ride.operator_slots) {
            slots.push(new OperatorSlot(this, slotData));
        }

        this.id = ride.id;

        this.state = new Vue({
            data: {
                controls: controls,
                name: ride.name,
                operatorSlots: slots,
                forceDisplay: ride.force_display || false
            }
        });
    }

    update(packet: PacketOperatorRideUpdate) {
        this.state.name = packet.ride.name || false;
        this.state.forceDisplay = packet.ride.force_display || false;
    }

    isOperator(uuid: string) {
        for (let operatorSlot of this.state.operatorSlots) {
            if (operatorSlot.state.uuid === uuid) {
                return true;
            }
        }
        return false;
    }

    getControlGroups(): string[][] {
        let groups: string[][] = [];
        for (let control of this.state.controls) {
            let group = control.state.group;
            let groupDisplay = control.state.groupDisplay;
            if (group != null) {
                if (groups.find(item => item[0] == group) == null) {
                    groups.push([group, groupDisplay ?? group]);
                }
            }
        }
        return groups.sort();
    }

    updateSlot(packet: PacketOperatorSlotUpdate) {
        for (let slot of this.state.operatorSlots) {
            if (slot.slot === packet.data.slot) {
                // console.log(packet);
                slot.update(packet);
                return;
            }
        }
        console.warn(`Failed to handle slot update`);
    }

    updateControl(packet: PacketOperatorControlUpdate) {
        for (let control of this.state.controls) {
            if (control.id === packet.control.id) {
                // console.log(packet);
                control.update(packet);
                return;
            }
        }
        console.warn("Failed to handle control update");
    }
}

export class OperatorSlot {
    state = new Vue({
        data: {
            uuid: null as string | null,
            name: null as string | null
        }
    });
    slot: any
    ride: OperableRide

    constructor(ride: OperableRide, operatorSlot: any) {
        this.ride = ride;
        // this.rideId = operatorSlot.ride_id;
        this.slot = operatorSlot.slot;
        this.state.uuid = operatorSlot.uuid
        this.state.name = operatorSlot.name
    }

    update(packet: PacketOperatorSlotUpdate) {
        this.state.uuid = packet.data.uuid || null;
        this.state.name = packet.data.name || null;
    }
}

export class OperatorControl {
    state = new Vue({
        data: {
            data: null as string | null,
            isEnabled: false,
            kind: null as string | null,
            name: null as string | null,
            sort: 0,
            group: "default",
            groupDisplay: null as string | null
        }
    });

    ride: OperableRide
    id: string

    constructor(ride: OperableRide, operatorControl: any) {
        this.ride = ride;
        // this.rideId = operatorControl.ride_id;
        this.id = operatorControl.id;

        this.state.data = operatorControl.data
        this.state.isEnabled = operatorControl.is_enabled
        this.state.kind = operatorControl.kind || null
        this.state.name = operatorControl.name || null
        this.state.sort = operatorControl.sort || null
        this.state.group = operatorControl.group || null
        this.state.groupDisplay = operatorControl.group_display || null

    }

    update(packet: PacketOperatorControlUpdate) {
        this.state.data = packet.control.data;
        this.state.isEnabled = packet.control.is_enabled;
        this.state.kind = packet.control.kind ?? null;
        this.state.name = packet.control.name ?? null;
        this.state.sort = packet.control.sort ?? null;
        this.state.group = packet.control.group ?? null;
        this.state.groupDisplay = packet.control.group_display ?? null;
    }
}