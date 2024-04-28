<template>
  <div class="operator-panel-control" v-show="operatorControl != null"
       :data-enabled="dataEnabled"
       :data-kind="dataKind"
       :data-on="dataOn"
       :data-flashing="flashing"
       :data-type="dataType">
    <div class="ride-name">
      <span class="tag">{{ operatorControl.state.name.replace(/§[0-9A-FK-OR]/gm, "") }}</span>
    </div>
    <div class="button"></div>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";

@Component({
  components: {}
})
export default class OperatorControl extends Vue {
  @Prop() operatorControl!: any

  get dataEnabled() {
    let control = this.operatorControl;
    if (control === null) return null;
    return control.state.isEnabled.toString();
  }

  get dataKind() {
    let control = this.operatorControl;
    if (control === null) return null;
    return control.state.kind;
  }

  get dataOn() {
    let control = this.operatorControl;
    if (control === null) return null;
    let kind = this.dataKind;
    if (kind === 'led') {
      return (control.state.data.color === 'green').toString();
    } else if (kind === 'switch') {
      // console.log(control.state.data);
      if (control.state.data.on !== null)
        return control.state.data.on.toString();
    }
    return null;
  }


  get flashing() {
    let control = this.operatorControl;
    if (control === null) return null;
    return control.state.data.flashing;
  }

  get dataType() {
    let control = this.operatorControl;
    if (control === null) return null;
    return control.state.data.type;
  }
}
</script>

<style scoped>
</style>
