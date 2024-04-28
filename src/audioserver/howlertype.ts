interface PannerAttr {
    coneInnerAngle?: number,
    coneOuterAngle?: number,
    coneOuterGain?: number,
    distanceModel: 'inverse' | 'linear',
    maxDistance: number,
    panningModel: 'HRTF' | 'equalpower',
    refDistance: number,
    rolloffFactor: number
}

interface HowlerPos {
    x: number,
    y: number,
    z: number,
    id?: number
}