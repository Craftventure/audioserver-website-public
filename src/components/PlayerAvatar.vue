<template>
  <div/>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import LiveMap from "@/components/LiveMap.vue";
import L, {Marker} from "leaflet";

@Component({
  components: {}
})
export default class PlayerAvatar extends Vue {
  @Prop() player!: any
  marker!: Marker;

  get avatarUrl(): string | null {
    if (this.player == null) return null;
    return 'https://crafatar.com/avatars/' + this.player.uuid + '?size=16&overlay'
  }

  get playerIsSelf() {
    if (this.player == null) return null;
    return this.$audioServer.state.verifiedUuid === this.player.uuid;
  }

  get selfLocation() {
    return this.$audioServer.managedData.location;
  }

  get mapHolder(): LiveMap {
    return (this.$parent as LiveMap)
  }

  get map(): L.Map {
    return (this.$parent as LiveMap).map!!
  }

  @Watch('scale')
  onScaleChanged() {
    this.updatePosition();
  }

  @Watch('selfLocation')
  onSelfLocationUpdated() {
    this.updatePosition();
  }

  @Watch('player')
  onPlayerChanged() {
    this.updatePosition();
  }

  @Watch('player.x')
  onPlayerXChanged() {
    this.updatePosition();
  }

  @Watch('player.z')
  onPlayerZChanged() {
    this.updatePosition();
  }

  @Watch('player.hidden')
  onPlayerHiddenChanged() {
    this.updatePosition();
  }

  @Watch('playerIsSelf')
  onPlayerIsSelfChanged() {
    this.updatePosition();
  }

  updatePosition() {
    this.marker.setZIndexOffset(this.player.y!!)
    this.marker.setLatLng(this.mapHolder.xy(this.player.x!!, this.player.z!!))
  }

  mounted() {
    // console.log("Adding marker", this.map)
    this.marker = L.marker(
        this.mapHolder.xy(this.player.x!!, this.player.z!!),
        {
          icon: new L.Icon({
            iconUrl: this.avatarUrl!!,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            className: 'pixelated'
          }),
          zIndexOffset: 1
        })
        .addTo(this.map)
        .bindPopup(this.player.name)
    this.updatePosition();
  }

  beforeDestroy() {
    this.marker?.remove()
  }
}
</script>
