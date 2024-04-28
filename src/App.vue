<template>
  <div id="app">
    <div id="pages" v-show="isVerified">
      <LoginForm/>
      <AudioControls class="page center" id="page-audio" v-show="activeItemId == 'page-audio'"/>
      <LiveMap class="page" id="page-map" v-show="activeItemId == 'page-map'"/>
      <PhotoFeed class="page" id="page-feed" v-show="activeItemId == 'page-feed'"/>
      <OperatorControls class="page" id="page-operator" v-show="activeItemId == 'page-operator'"/>
      <NowPlayingFeed class="page center" id="page-now-playing" v-show="activeItemId == 'page-now-playing'"/>
    </div>
    <md-bottom-bar id="mainMenu" :md-active="activeItem" v-on:md-changed="_onPageChanged" v-show="isVerified">
      <md-bottom-bar-item id="tab-audio" md-label="Audio" md-icon="audiotrack"/>
      <md-bottom-bar-item id="tab-feed">
        <md-icon class="md-bottom-bar-icon">rss_feed</md-icon>
        <span class="md-bottom-bar-label">Feed</span>
        <!--                <i class="badge" v-if="true">20</i>-->
      </md-bottom-bar-item>
      <md-bottom-bar-item id="tab-map" md-label="Map" md-icon="map"/>
      <md-bottom-bar-item id="tab-operator" md-label="Operator" md-icon="touch_app"/>
      <md-bottom-bar-item id="tab-now-playing" md-label="Now Playing" md-icon="library_music"/>
    </md-bottom-bar>
  </div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from "vue-property-decorator";
import LoginForm from "@/components/LoginForm.vue";
import LiveMap from "@/components/LiveMap.vue";
import AudioControls from "@/components/AudioControls.vue";
import PhotoFeed from "@/components/PhotoFeed.vue";
import OperatorControls from "@/components/OperatorControls.vue";
import NowPlayingFeed from "@/components/NowPlayingFeed.vue";

@Component({
  components: {
    NowPlayingFeed,
    OperatorControls,
    PhotoFeed,
    AudioControls,
    LiveMap,
    LoginForm
  }
})
export default class App extends Vue {
  activeItem: string = "tab-feed"
  activeItemId: string = this.activeItem;

  get isVerified() {
    return this.$audioServer.state.isVerified;
  }

  @Watch('activeItem')
  onActiveItemChanged() {
    this._updatePage();
  }

  _onPageChanged(event: any) {
    this.activeItem = event;
  }

  _updatePage() {
    this.activeItemId = this.activeItem.replace("tab", "page");
    // let pages = this.$el.querySelectorAll(".page");
    // pages.forEach(page => {
    //   let visible = page.id === this.activeItem.replace("tab", "page");
    //   (page as HTMLElement).style.display = visible ? "block" : "none";
    // })
  }

  mounted() {
    this._updatePage();
  }
}
</script>

<style lang="scss">
body {
  display: flex;
  flex-direction: column;
}

@import "~vue-material/dist/theme/engine";

@include md-register-theme("default", (
    primary: #ff9600,
    accent: #FFFF55
));

@include md-register-theme("cv-light", (
    primary: #ff9600,
    accent: #FFFF55
));

@include md-register-theme("cv-dark", (
    primary: #ff9600,
    accent: #FFFF55,
    theme: dark
));

@import "~leaflet/dist/leaflet.css";
@import "~vue-material/dist/theme/all";

$themeColor: #ff9600;
$tooltipColor: #000;
@import '~vue-slider-component/lib/theme/default.scss';
@import 'app.scss';

html, body {
  user-select: none;

  //background-image: url('assets/background.png');
  //background-size: cover;
  //background-repeat: no-repeat;
  //background-position: 50% 50%;
}

#wallpaper {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  background-image: url('assets/background.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: 50% 50%;
  z-index: -1;
}
</style>
<style scoped>
.page {
  flex: 1;
  overflow: auto;
  position: relative;
}

.page > :first-child {
  min-height: 100%;
}

.page.center {
  display: flex;
  align-items: center;
  align-content: center;
  justify-items: center;
  justify-content: center;
  min-height: 0;
}

.page.center > :first-child {
  min-height: 0;
}

#pages {
  flex: 2;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  height: 100vh;
  flex: 1;
  display: flex;
  flex-direction: column;

  -webkit-backdrop-filter: blur(3mm);
  backdrop-filter: blur(3mm);
}

.md-overlay {
  -webkit-backdrop-filter: blur(3mm);
  backdrop-filter: blur(3mm);
}

.badge {
  width: 19px;
  height: 19px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 6px;
  transform: translateX(50%);
  background: #fff;
  border-radius: 100%;
  color: #000;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  letter-spacing: -.05em;
  font-family: 'Roboto Mono', monospace;
}
</style>
