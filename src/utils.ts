import {Area, PacketPoint} from "@/audioserver/packets";
import {Point} from "leaflet";

export function isSafari(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('safari') != -1) {
        return ua.indexOf('chrome') <= -1
    }
    return false
}

export function isInArea(area: Area, location: { x: number, y: number, z: number }): boolean {
    if (location.x >= area.xMin && location.x <= area.xMax)
        if (location.y >= area.yMin && location.y <= area.yMax)
            if (location.z >= area.zMin && location.z <= area.zMax)
                return true
    return false
}

export function packetPointToLeafletPoint(point?: PacketPoint): Point | undefined {
    if (point == null) return undefined
    return new Point(point.x, point.y)
}