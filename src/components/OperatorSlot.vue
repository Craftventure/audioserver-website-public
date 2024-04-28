<template>
  <div class="operator-panel-operator-slot" v-show="operatorSlot != null">
    <div class="ride-name">
      <span class="tag">Operator {{ operatorSlot !== null ? "#" + (operatorSlot.slot + 1) : "" }}</span>
    </div>
    <div class="button" v-bind:style="{ backgroundImage: 'url('+background+')' }">
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";

@Component({
  components: {}
})
export default class OperatorSlot extends Vue {
  @Prop() operatorSlot!: any;

  get background() {
    if (this.operatorSlot == null) return null;
    if (this.operatorSlot.state.uuid != null) {
      return 'https://crafatar.com/avatars/' + this.operatorSlot.state.uuid + '?size=128&overlay';
      // return 'https://crafatar.com/renders/head/' + this.operatorSlot.state.uuid + '?size=128';
    } else {
      return require('../assets/key.png')
    }
  }
}
</script>

<style scoped>
</style>
