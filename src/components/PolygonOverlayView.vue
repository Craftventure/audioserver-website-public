<template>
  <div/>
</template>


<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import LiveMap from "@/components/LiveMap.vue";
import L, {LatLngBounds, Polygon} from "leaflet";
import {MapPolygonOverlay} from "@/audioserver/packets";

@Component({
  components: {}
})
export default class PolygonOverlayView extends Vue {
  @Prop() data!: MapPolygonOverlay
  polygon?: Polygon;

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
    // TODO: Support updating
    // this.recreatePolygon()\
    // this.polygon!!.setLatLng(this.mapHolder.xy(this.data.x, this.data.z))
    // this.polygon!!.setZIndexOffset(this.data.zIndex)
    // if (this.data.popupName != this.polygon?.getPopup()?.getContent()) {
    //   if (this.data.popupName != null)
    //     this.polygon!!.bindPopup(this.data.popupName)
    //   this.polygon!!.unbindPopup()
    // }
  }

  updateForPosition() {
  }

  mounted() {
    if (this.polygon == null)
      this.recreatePolygon()
    else
      this.onDataUpdated()
    // if (!this.map.hasLayer(this.polygon!!))
    //   this.polygon!!.addTo(this.map)
    this.updateForPosition();
  }

  recreatePolygon() {
    this.removePolygon()
    // console.log(packetPointToLeafletPoint(this.data.popupAnchor))

    // console.log("recrete")

    if (this.data.group?.startsWith("crew") == true) {
      this.mapHolder.setupCrewLayerGroups();
    }

    this.polygon = L.rectangle(new LatLngBounds(this.mapHolder.xy(this.data.min!!.x, this.data.min!!.z), this.mapHolder.xy(this.data.max!!.x, this.data.max!!.z)), {
      color: this.data.fillColor ?? "#ff7800",
      weight: 1,
    }).addTo(this.map);

    if (this.data.title != null)
      this.polygon!!.bindPopup(this.data.title)
    // if (this.layer.group === "interior")
    this.mapHolder.addPolygonOverlay(this.polygon, this.data.group)
  }

  removePolygon() {
    if (this.polygon == null || !this.map.hasLayer(this.polygon)) return
    this.mapHolder.removePolygonOverlay(this.polygon!!, this.data.group)
    this.polygon?.remove()
  }

  beforeDestroy() {
    // console.log("beforeDestroy")
    this.removePolygon()
  }
}
</script>