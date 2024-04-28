<template>
  <div class="tabMap">
    <div id="map"/>
    <PlayerAvatar v-for="player in players" :key="player.uuid" v-bind:player="player"/>
    <MapLayerView v-for="layer in layers" :key="layer.id" v-bind:layer="layer"/>
    <MapMarkerView v-for="marker in markers" :key="marker.id" v-bind:data="marker"/>
    <PolygonOverlayView v-for="polygon in polygons" :key="polygon.id" v-bind:data="polygon"/>
    <md-button class="md-fab md-fab-bottom-right md-primary" id="followSelf" v-on:click.native="toggleFollowSelf">
      <md-icon>{{ fabIcon }}</md-icon>
    </md-button>
  </div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from "vue-property-decorator";
import PlayerAvatar from "@/components/PlayerAvatar.vue";
import L, {Control, ImageOverlay, LeafletEvent, Marker, Polygon} from 'leaflet';
import {AudioServerPacketEvent} from "@/audioserver/audioserver";
import {
  MapLayer,
  MapMarker,
  MapPolygonOverlay,
  PacketID,
  PacketMapLayersAdd,
  PacketMapLayersRemove,
  PacketMarkersAdd,
  PacketMarkersRemove,
  PacketPolygonOverlayAdd,
  PacketPolygonOverlayRemove
} from "@/audioserver/packets";
import MapLayerView from "@/components/MapLayerView.vue";
import MapMarkerView from "@/components/MapMarkerView.vue";
import PolygonOverlayView from "@/components/PolygonOverlayView.vue";

@Component({
  components: {
    PolygonOverlayView,
    MapMarkerView,
    MapLayerView,
    PlayerAvatar,
  }
})
export default class LiveMap extends Vue {
  map: L.Map | null = null
  isZooming: Boolean = false
  isDragging: Boolean = false
  isFollowSelf: Boolean = true
  layers: MapLayer[] = []
  markers: MapMarker[] = []
  polygons: MapPolygonOverlay[] = []
  layerGroups = new Map<string, L.LayerGroup>()
  layerControls?: Control.Layers;
  private crewSetup: boolean = false;

  get fabIcon(): string {
    if (this.isFollowSelf)
      return 'gps_fixed'
    else
      return 'gps_not_fixed'
  }

  toggleFollowSelf() {
    this.isFollowSelf = !this.isFollowSelf
  }

  xy(x: number, y: number) {
    return L.latLng(y, -x);  // When doing xy(x, y);
  }

  constructor() {
    super();
  }

  get players() {
    return this.$audioServer.managedData.players;
  }

  get location() {
    return this.$audioServer.managedData.location;
  }

  @Watch('isFollowSelf')
  onFollowSelfChanged() {
    if (this.isFollowSelf) {
      this._updateMap()
    }
  }

  @Watch('players')
  onPlayersChanged() {
    this._updateMap();
  }

  @Watch('location')
  onLocationChanged() {
    this._updateMap();
  }

  // _handleScroll(event: any) {
  //     let scroll = event.deltaY < 0 ? -0.15 : 0.15;
  //     this.zoomBy(-scroll * this.scale);
  // }

  // zoomBy(scaleDelta: number) {
  //     this.scale = this.scale + scaleDelta > this.maxScale ? this.maxScale : this.scale + scaleDelta < this.minScale ? this.minScale : this.scale + scaleDelta;
  //     this._updateMap();
  // }

  _onResize() {
    // console.log("Resized");
    this.map?.invalidateSize();
  }

  _updateMap() {
    // console.log("Updating map");
    // eslint-disable-next-line no-constant-condition

    let map = this.map;
    if (map == null) return;

    // if ((this.$el as HTMLElement).offsetParent == null) {
    //     return;
    // }
    //
    // let tabMap = (this.$el as HTMLElement);
    // let scale = this.scale;
    let location = this.location;
    if (location == null) return;
    // tabMap.style.backgroundSize = `${this.mapSize.width * scale}px ${this.mapSize.height * scale}px`;
    //
    // if (location != null) {
    //     tabMap.style.backgroundPosition = `${((this.mapSize.x - location.x!!) * scale) + (tabMap.offsetWidth / 2)}px ` +
    //         `${((this.mapSize.y - location.z!!) * scale) + (tabMap.offsetHeight / 2)}px`;
    // } else {
    //     tabMap.style.backgroundPosition = `${((this.mapSize.x - 88) * scale) + (tabMap.offsetWidth / 2)}px ` +
    //         `${((this.mapSize.y - -625) * scale) + (tabMap.offsetHeight / 2)}px`;
    // }

    // let marker = this.selfMarker;
    // if (marker == null) return;

    // marker.setLatLng(this.xy(location.x!!, location.z!!))
    if (!this.isDragging && this.isFollowSelf)
      map.panTo(this.xy(location.x!!, location.z!!))
  }

  created() {
    this.$audioServer.state.$on("packet", (packetEvent: AudioServerPacketEvent) => {
      if (packetEvent.isHandled === true) return;
      let packetData = packetEvent.data;
      if (packetEvent.id === PacketID.ADD_MAP_LAYERS) {
        packetEvent.isHandled = true;
        // console.log(packetData)
        let packet = new PacketMapLayersAdd().fromJson(packetData);
        let layers = this.layers
        if (packet.mode == "SET") {
          if (packet.group != null)
            layers = layers.filter(item => item.group !== packet.group)
          else
            layers = []
        }
        let addIds = new Set(packet.layers.map((item) => item.id))
        layers = layers.filter((item) => !addIds.has(item.id))
        packet.layers.forEach((item) => layers.push(item))
        this.layers = layers;

      } else if (packetEvent.id === PacketID.REMOVE_MAP_LAYERS) {
        packetEvent.isHandled = true;
        let packet = new PacketMapLayersRemove().fromJson(packetData);
        let removeIds = new Set(packet.remove.map((item) => item))
        this.layers = this.layers.filter((item) => !removeIds.has(item.id))
        if (packet.group != null)
          this.layers = this.layers.filter(layer => layer.group != packet.group)

      } else if (packetEvent.id === PacketID.MARKER_ADD) {
        // console.log(packetData)
        packetEvent.isHandled = true;
        // console.log(packetData)
        let packet = new PacketMarkersAdd().fromJson(packetData);
        let markers = this.markers
        if (packet.mode == "SET") {
          if (packet.group != null)
            markers = markers.filter(item => item.group !== packet.group)
          else
            markers = []
        }
        let addIds = new Set(packet.markers.map((item) => item.id))
        markers = markers.filter((item) => !addIds.has(item.id))
        packet.markers.forEach((item) => markers.push(item))
        this.markers = markers

      } else if (packetEvent.id === PacketID.MARKER_REMOVE) {
        packetEvent.isHandled = true;
        let packet = new PacketMarkersRemove().fromJson(packetData);
        let removeIds = new Set(packet.remove.map((item) => item))
        this.markers = this.markers.filter((item) => !removeIds.has(item.id))
        if (packet.group != null)
          this.markers = this.markers.filter(marker => marker.group != packet.group)
      } else if (packetEvent.id === PacketID.POLYGON_OVERLAY_ADD) {
        // console.log(packetData)
        packetEvent.isHandled = true;
        // console.log(packetData)
        let packet = new PacketPolygonOverlayAdd().fromJson(packetData);
        let polygons = this.polygons
        if (packet.mode == "SET") {
          if (packet.group != null)
            polygons = polygons.filter(item => item.group !== packet.group)
          else
            polygons = []
        }
        let addIds = new Set(packet.polygons.map((item) => item.id))
        polygons = polygons.filter((item) => !addIds.has(item.id))
        packet.polygons.forEach((item) => polygons.push(item))
        this.polygons = polygons

      } else if (packetEvent.id === PacketID.POLYGON_OVERLAY_REMOVE) {
        packetEvent.isHandled = true;
        let packet = new PacketPolygonOverlayRemove().fromJson(packetData);
        let removeIds = new Set(packet.remove.map((item) => item))
        this.polygons = this.polygons.filter((item) => !removeIds.has(item.id))
        if (packet.group != null)
          this.polygons = this.polygons.filter(marker => marker.group != packet.group)
      }
    });
  }

  addOverlay(overlay: ImageOverlay, group?: string) {
    if (group == null) return
    this.layerGroups.get(group)?.addLayer(overlay)
  }

  removeOverlay(overlay: ImageOverlay, group?: string) {
    if (group == null) return
    this.layerGroups.get(group)?.removeLayer(overlay)
  }

  addMarker(overlay: Marker, group?: string) {
    if (group == null) return
    this.layerGroups.get(group)?.addLayer(overlay)
  }

  removeMarker(overlay: Marker, group?: string) {
    if (group == null) return
    this.layerGroups.get(group)?.removeLayer(overlay)
  }

  addPolygonOverlay(overlay: Polygon, group?: string) {
    if (group == null) return
    let groupLayer = this.layerGroups.get(group);
    if (groupLayer == null) return;
    groupLayer.addLayer(overlay)
    if (this.map?.hasLayer(groupLayer) != true) {
      this.map?.removeLayer(overlay)
    }
  }

  removePolygonOverlay(overlay: Polygon, group?: string) {
    if (group == null) return
    this.layerGroups.get(group)?.removeLayer(overlay)
  }

  mounted() {
    window.addEventListener('resize', this._onResize);
    this._updateMap();
    var map = L.map('map', {
      crs: L.CRS.Simple,
      minZoom: 0,
      maxZoom: 3,
      zoomDelta: 0.3,
      zoomSnap: 0,
      center: [0.0, 0.0],
      attributionControl: false
    })
    this.map = map;
    map.setView(this.xy(90, -960), 2);

    map.on('zoomstart', (event: LeafletEvent) => {
      this.isZooming = true
    });
    map.on('zoomend', (event: LeafletEvent) => {
      this.isZooming = false
      this._updateMap()
    });
    map.on('dragstart', (event: LeafletEvent) => {
      this.isDragging = true
      this.isFollowSelf = false
    });
    map.on('dragend', (event: LeafletEvent) => {
      this.isDragging = false
      this._updateMap()
    });

    L.tileLayer(
        '/tiles/world/{z}/{x}/{y}.png',
        {
          tileSize: 256 * L.CRS.Simple.scale(1),
          minNativeZoom: 1,
          maxNativeZoom: 1,
          className: "pixelated"
        }
    ).addTo(map);

    this.layerGroups.set("interior", L.layerGroup([]).addTo(map));
    this.layerGroups.set("shop", L.layerGroup([]).addTo(map));
    this.layerGroups.set("ride", L.layerGroup([]).addTo(map));
    this.layerGroups.set("parktrain", L.layerGroup([]).addTo(map));
    this.layerGroups.set("poi", L.layerGroup([]).addTo(map));

    this.layerControls = L.control.layers({}, {
      "Interiors (early test)": this.layerGroups.get("interior")!!,
      "Rides (early test)": this.layerGroups.get("ride")!!,
      "Stores (early test)": this.layerGroups.get("shop")!!,
      "POIs (early test)": this.layerGroups.get("poi")!!,
      "Park Train (early test)": this.layerGroups.get("parktrain")!!,
    }).addTo(map);

    this._waitForHeight();
  }

  setupCrewLayerGroups() {
    if (this.crewSetup) return;
    this.crewSetup = true;
    let layerGroupCrewWorldBorder = L.layerGroup([]);
    this.layerGroups.set("crew_worldborder", layerGroupCrewWorldBorder.addTo(this.map!!));
    this.layerControls?.addOverlay(layerGroupCrewWorldBorder, "[Crew] World Border")
    layerGroupCrewWorldBorder!!.removeFrom(this.map!!);
  }

  _waitForHeight() {
    requestAnimationFrame(() => {
      const height = (this.$el as HTMLElement).offsetHeight;
      if (height == 0) {
        this._waitForHeight();
      } else {
        this.map?.invalidateSize()
      }
    })
  }

  beforeDestroy() {
    window.removeEventListener('resize', this._onResize);
  }
}
</script>

<style scoped>
.tabMap {
  position: relative;

  /*background: #6b9c36;*/
  /*image-rendering: pixelated;*/
  /*background-size: 300%;*/
  overflow: hidden !important;
}

.leaflet-container {
  background: #6d9930;
}

.md-fab {
  z-index: 500;
}

>>> .pixelated {
  image-rendering: pixelated;
}

#map {
  position: absolute;
  width: 100%;
  height: 100%;
}

>>> .twemoji-marker {
  width: 100%;
  height: 100%;
}
</style>
