<template>
  <div class="audioControls">
    <md-card v-show="isVerified">
      <md-card-header>
        <div class="md-title">Welcome to Craftventure!</div>
      </md-card-header>

      <md-card-content>
        <div class="md-layout">
          <p class="md-layout-item md-body-1  md-size-100">
            You connected with the AudioServer, you can go back to Minecraft now!
          </p>

          <md-field>
            <label for="theme">Theme</label>
            <md-select name="theme" id="theme" v-model="theme" md-dense>
              <md-option value="cv-light">Light</md-option>
              <md-option value="cv-dark">Dark</md-option>
            </md-select>
          </md-field>

          <template v-for="slider in sliders">
            <div v-bind:key="slider.name" class="md-layout-item md-body-1  md-size-100" v-if="slider.visible != false">
              <div class="label">
                <md-icon>volume_up</md-icon>
                <span class="md-body-1">{{ slider.name }}</span>
              </div>
              <VueSlider class="volume-slider" type="range" v-bind:min="0" v-bind:max="100"
                         v-model="slider.value"
                         :tooltip-formatter="val => val +'%'"/>
            </div>
          </template>
        </div>
      </md-card-content>

      <md-card-actions>
        <md-button @click="disconnect">Disconnect</md-button>
      </md-card-actions>
    </md-card>
  </div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator';
import VueSlider from "vue-slider-component";

@Component({
  components: {
    VueSlider
  }
})
export default class AudioControls extends Vue {
  theme: string = this.$localConfig.config.theme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? "cv-dark" : "cv-light")

  get isVerified() {
    return this.$audioServer.state.isVerified;
  }

  @Watch('theme')
  onThemeChanged(theme: string) {
    this.$localConfig.config.theme = theme;
    this.$material.theming.theme = theme;
  }

  get sliders() {
    return this.$audioServer.state.volume;
  }

  disconnect() {
    this.$audioServer.disconnect();
  }

  mounted() {
    this.$material.theming.theme = this.theme;
  }
}
</script>

<style scoped>
input[type=range] {
  width: 100%;
}

.label {
  display: flex;
  align-items: center;
}

.label span {
  flex: 1;
  margin-left: 8px;
}

.md-card {
  max-width: 500px;
}

.volume-slider .vue-slider-dot {
  background-color: red !important;
}

.audioControls {
  width: 100%;
  position: relative;
  padding: 16px;
}
</style>
