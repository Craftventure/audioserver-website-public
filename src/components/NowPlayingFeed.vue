<template>
  <div class="playingFeed">
    <md-card>
      <md-card-header>
        <div class="md-title">Now Playing</div>
      </md-card-header>

      <md-card-content>
        <div class="md-layout">
          <p class="md-body-1">
            In this tab we'll display the songs that are currently playing. For many songs, we'll also
            provide links to Spotify/YouTube so you can listen/buy them. Many of the songs we use are also
            on our Spotify list:
            <a href="spotify:playlist:3Z2venyZi2DygOJzfiF9bO">spotify:playlist:3Z2venyZi2DygOJzfiF9bO</a>
          </p>
          <p class="md-body-1">
            Let us know about any mistakes and/or missing information on our Discord: <a
              href="https://discord.craftventure.net">discord.Craftventure.net</a>
          </p>

          <template v-for="area in areas">
            <div class="feedItem area-item" v-bind:key="area.id"
                 v-if="area.state.shouldDisplay">
              <p class="md-subheading">{{ area.cleanName() }}</p>
              <!--                                                        State: id={{area.areaId}} hasFinished={{area.state.hasFinished}}-->
              <!--                                                        playing={{area.state.playing}}-->
              <!--                                                        playWhenReady={{area.state.playWhenReady}} resourcesReady={{area.state.resourcesReady}}-->
              <!--                                                        isOverridden={{area.state.isOverridden}}<br/>-->

              <div class="md-body-1" v-if="!area.hasDescribableResources()">Unknown songs</div>

              <template v-for="(resource, resourceIndex) in area._resources">
                <div class="md-body-1 resource-item" v-bind:key="resource.resource.location"
                     v-if="resource.describe() != null">
                  {{ resourceIndex + 1 }}:
                  <a target="_blank"
                     :href="resource.resource.spotify_uri || resource.resource.listen_url">
                    {{ resource.describe() }}
                  </a>
                  <md-icon class="uninteractable" v-if="resource.state.playing">
                    play_arrow
                  </md-icon>
                </div>
              </template>
            </div>
          </template>
        </div>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import {Component, Vue} from "vue-property-decorator";

@Component({
  components: {}
})
export default class NowPlayingFeed extends Vue {
  get areas() {
    return this.$areaManager.state.$data.areaGetter();
  }

  disconnect() {
    this.$audioServer.disconnect();
  }

  photoTypeNameConverter(name) {
    if (name === "ONRIDE_PICTURE") {
      return "Onride picture"
    }
    return name;
  }
}
</script>

<style scoped>
.playingFeed {
  width: 100%;
  position: relative;
  padding: 16px;
}

.feedItem {
  min-width: 100%;
  margin-bottom: 16px;
}

.uninteractable {
  cursor: not-allowed;
}

.md-card {
  max-width: 500px;
}
</style>
