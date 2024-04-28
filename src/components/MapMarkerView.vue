<template>
  <div/>
</template>


<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import LiveMap from "@/components/LiveMap.vue";
import L, {BaseIconOptions, DivIcon, Icon, Marker} from "leaflet";
import {MapMarker} from "@/audioserver/packets";
import {packetPointToLeafletPoint} from "@/utils";
import twemoji from 'twemoji';

@Component({
  components: {}
})
export default class MapMarkerView extends Vue {
  @Prop() data!: MapMarker
  marker?: Marker;

  get selfLocation() {
    return this.$audioServer.managedData.location;
  }

  get mapHolder(): LiveMap {
    return (this.$parent as LiveMap)
  }

  get map(): L.Map {
    return (this.$parent as LiveMap).map!!
  }

  @Watch('selfLocation')
  onSelfLocationUpdated() {
    this.updateForPosition();
  }

  @Watch('data')
  onDataUpdated() {
    // this.recreateMarker()
    this.marker!!.setLatLng(this.mapHolder.xy(this.data.x, this.data.z))
    this.marker!!.setZIndexOffset(this.data.zIndex)
    if (this.data.popupName != this.marker?.getPopup()?.getContent()) {
      if (this.data.popupName != null)
        this.marker!!.bindPopup(this.data.popupName)
      this.marker!!.unbindPopup()
    }
  }

  updateForPosition() {
  }

  mounted() {
    if (this.marker == null)
      this.recreateMarker()
    else
      this.onDataUpdated()
    // if (!this.map.hasLayer(this.marker!!))
    //   this.marker!!.addTo(this.map)
    this.updateForPosition();
  }

  recreateMarker() {
    this.removeMarker()
    // console.log(packetPointToLeafletPoint(this.data.popupAnchor))

    // console.log("recrete")

    let icon: Icon | DivIcon | null = null
    let iconType = this.data.type
    if (iconType === "twemoji") {
      const emoji = twemoji.parse(this.data.url!!, {
        className: "twemoji-marker",
        // folder: 'svg',
        // ext: '.svg'
      })
      const newIcon = L.divIcon({
        html: emoji,
        className: this.data.className,
        // iconSize: packetPointToLeafletPoint(this.data.size),
        // iconAnchor: packetPointToLeafletPoint(this.data.anchor),
        // popupAnchor: packetPointToLeafletPoint(this.data.popupAnchor),
      })
      const options = newIcon.options as BaseIconOptions
      if (this.data.size != undefined) options.iconSize = packetPointToLeafletPoint(this.data.size)
      if (this.data.anchor != undefined) options.iconAnchor = packetPointToLeafletPoint(this.data.anchor)
      if (this.data.popupAnchor != undefined) options.popupAnchor = packetPointToLeafletPoint(this.data.popupAnchor)
      icon = newIcon
    } else {
      const newIcon = new L.Icon({
        iconUrl: this.data.url ?? this.data.base64 ?? "https://cdn.iconscout.com/icon/premium/png-256-thumb/place-marker-3-599570.png",
        className: this.data.className,
        // iconSize: packetPointToLeafletPoint(this.data.size),
        // iconAnchor: packetPointToLeafletPoint(this.data.anchor),
        // popupAnchor: packetPointToLeafletPoint(this.data.popupAnchor),
      })
      const options = newIcon.options as BaseIconOptions
      if (this.data.size != undefined) options.iconSize = packetPointToLeafletPoint(this.data.size)
      if (this.data.anchor != undefined) options.iconAnchor = packetPointToLeafletPoint(this.data.anchor)
      if (this.data.popupAnchor != undefined) options.popupAnchor = packetPointToLeafletPoint(this.data.popupAnchor)
      icon = newIcon
    }
    this.marker = L.marker(
        this.mapHolder.xy(this.data.x, this.data.z),
        {
          icon: icon!!,
          zIndexOffset: this.data.zIndex
        })
        .addTo(this.map)

    if (this.data.popupName != null)
      this.marker!!.bindPopup(this.data.popupName)
    // if (this.layer.group === "interior")
    this.mapHolder.addMarker(this.marker, this.data.group)
  }

  removeMarker() {
    if (this.marker == null || !this.map.hasLayer(this.marker)) return
    this.mapHolder.removeMarker(this.marker!!, this.data.group)
    this.marker?.remove()
  }

  beforeDestroy() {
    // console.log("beforeDestroy")
    this.removeMarker()
  }
}
</script>