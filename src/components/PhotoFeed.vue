<template>
  <div class="photoFeed">
    <md-card>
      <md-card-header>
        <div class="md-title">Photo feed</div>
      </md-card-header>

      <md-card-content>
        <div class="md-layout">
          <p class="md-layout-item md-body-1 md-size-100">
            At several locations within the parks (currently only for some rides), pictures are taken which
            will appear right here in this feed. This includes but is not limited to for example Fenrir,
            Space Mountain and Agua Azul. Click on the pictures to download them.
          </p>

          <template v-for="photo in photos">
            <div class="md-layout-item parkPhotoItem" v-bind:key="photo.time">
              <a v-bind:href="'data:image/png;base64,' + photo.data"
                 v-bind:download="photo.name + '_' + photo.type.toLocaleLowerCase() + '_at_' + photo.time + '.png'">
                <img class="parkPhotoInstance" v-bind:src="'data:image/png;base64,' + photo.data"/>
              </a>
              <p class="md-subheading">{{ photoTypeNameConverter(photo.type) + ": " + photo.name }}</p>
            </div>
          </template>
        </div>
      </md-card-content>
    </md-card>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';

@Component({
  components: {}
})
export default class Photofeed extends Vue {
  get photos() {
    return this.$audioServer.managedData.parkPhotos;
  }

  photoTypeNameConverter(name: string) {
    if (name === "ONRIDE_PICTURE") {
      return "Onride picture"
    }
    return name;
  }
}
</script>

<style scoped>
.photoFeed {
  width: 100%;
  position: relative;
  padding: 16px;
}

.parkPhotoItem {
  min-width: 272px;
  margin-bottom: 16px;
  text-align: center;
}

.parkPhotoHolder {
}

.parkPhotoInstance {
  width: 256px;
  height: 256px;
  image-rendering: pixelated;
}
</style>
