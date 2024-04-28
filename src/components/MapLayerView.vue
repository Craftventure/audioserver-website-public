<template>
  <div/>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import LiveMap from "@/components/LiveMap.vue";
import L, {ImageOverlay, LatLngBounds} from "leaflet";
import {MapLayer} from "@/audioserver/packets";
import {isInArea} from "@/utils";

@Component({
  components: {}
})
export default class MapLayerView extends Vue {
  @Prop() layer!: MapLayer
  overlay?: ImageOverlay | null;

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

  updateForPosition() {
    if (this.layer.visibilityAreas == null || this.layer.visibilityAreas.length == 0) {
      this.overlay!!.setOpacity(1)
      return;
    }
    if (this.selfLocation == null) return

    let location = {x: this.selfLocation!!.x!!, y: this.selfLocation!!.y!!, z: this.selfLocation!!.z!!}
    let inArea = false;
    this.layer.visibilityAreas?.forEach((area) => {
      if (isInArea(area, location))
        inArea = true
    })
    this.overlay!!.setOpacity(inArea ? 1 : 0)
    // console.log("update position")
  }

  mounted() {
    this.overlay = L.imageOverlay(
        this.layer.url ?? this.layer.base64!,
        new LatLngBounds(
            this.mapHolder.xy(this.layer.x, this.layer.z),
            this.mapHolder.xy(this.layer.x + this.layer.width, this.layer.z + this.layer.height)
        ),
        {
          className: "pixelated",
          zIndex: this.layer.zIndex
        })
        .addTo(this.map)
    this.updateForPosition();
    // if (this.layer.group === "interior")
    this.mapHolder.addOverlay(this.overlay, this.layer.group)
  }

  beforeDestroy() {
    if (this.overlay == null) return
    // if (this.layer.group === "interior")
    this.mapHolder.removeOverlay(this.overlay!!, this.layer.group)
    this.overlay?.remove()
    this.overlay = null
  }
}
</script>
