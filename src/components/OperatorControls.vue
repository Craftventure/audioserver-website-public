<template>
  <div class="operatorControls">
    <md-card>
      <md-card-header v-show="ridesSorted.length === 0">
        <div class="md-title">Operator controls</div>
      </md-card-header>

      <md-card-content>
        <div class="md-layout">
          <p class="md-layout-item md-body-1 md-size-100" v-show="ridesSorted.length === 0">
            Ride operating is a mode available to VIPs. If you're a VIP, just start operating any of the
            available rides using '/rideop' and the operator panel of that ride will appear here
          </p>

          <div class="md-layout-item md-size-100" v-for="ride in ridesSorted" v-bind:key="ride.id">
            <h1>{{ ride.state.name }}</h1>
            <OperatorSlot v-for="operatorSlot in ride.state.operatorSlots"
                          v-on:click.native="onOperatorSlotClicked(operatorSlot)"
                          v-bind:operator-slot="operatorSlot"
                          v-bind:key="ride.id + operatorSlot.slot"/>

            <template v-for="control in ride.state.controls">
              <OperatorControl
                  v-if="control.state.group === null"
                  v-on:click.native="onControlClicked(control)"
                  v-bind:operator-control="control"
                  v-bind:key="ride.id + control.id"/>
            </template>

            <template v-for="group in ride.getControlGroups()">
              <div v-bind:key="ride.id + group[0]" class="operator-control-group">
                <h3>{{ group[1].charAt(0).toUpperCase() + group[1].substring(1) }}</h3>
                <template v-for="control in ride.state.controls">
                  <OperatorControl v-if="control.state.group === group[0]"
                                   v-on:click.native="onControlClicked(control)"
                                   v-bind:operator-control="control"
                                   v-bind:key="ride.id + control.id + group[0]"/>
                </template>
              </div>
            </template>
          </div>
        </div>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import {Component, Vue} from "vue-property-decorator";
import OperatorSlot from "@/components/OperatorSlot";
import OperatorControl from "@/components/OperatorControl";
import {PacketOperatorControlClick} from "@/audioserver/packets";

@Component({
  components: {
    OperatorSlot,
    OperatorControl
  }
})
export default class OperatorControls extends Vue {
  onControlClicked(control) {
    // console.log(control);
    this.$audioServer.send(new PacketOperatorControlClick().set(control.ride.id, control.id).asJson());
  }

  onOperatorSlotClicked(slot) {
    // console.log(slot);
    this.$audioServer.send(new PacketOperatorControlClick().set(slot.ride.id, slot.slot).asJson());
  }

  get selfUuid() {
    return this.$audioServer.state.verifiedUuid;
  }

  get rides() {
    return this.$operatorManager.state.rides;
  }

  get ridesSorted() {
    let rides = this.rides;
    let selfUuid = this.selfUuid;
    let newRides = [];
    let forcedRides = [];

    for (let ride of rides) {
      if (ride.isOperator(selfUuid)) {
        newRides.push(ride)
      } else if (ride.state.forceDisplay) {
        forcedRides.push(ride)
      }
    }

    return newRides.concat(forcedRides);
  }
}
</script>

<style scoped>
.operatorControls {
  width: 100%;
  position: relative;
  padding: 16px;
}
</style>
<style>

.operator-panel {
  user-select: none;
  padding: 16px;
}

.operator-panel-operator-slot {
  display: inline-block;
  margin-left: 5px;
  margin-right: 5px;
  background: #1d1d1d;
  padding: 4px;
}

.operator-panel-control {
  display: inline-block;
  margin-left: 5px;
  margin-right: 5px;
  background: #1d1d1d;
  padding: 4px;
}

.operator-panel-operator-slot .ride-name,
.operator-panel-control .ride-name {
  width: 90px;
  min-height: 50px;
  text-align: center;
  line-height: 1.2;
  background: #e4e4e4;
  font-size: 0.8em;
  display: table;
  text-transform: uppercase;
}

.operator-panel-control .ride-name .tag,
.operator-panel-operator-slot .ride-name .tag {
  vertical-align: middle;
  display: table-cell;
  color: black;
  font-weight: bold;
}

.operator-panel-control[data-kind="switch"][data-type="open_closed"] .ride-name .tag:after {
  content: "\aOpen/Closed";
  white-space: pre;
}

.operator-panel-control[data-kind="switch"][data-type="on_off"] .ride-name .tag:after {
  content: "\aOn/Off";
  white-space: pre;
}

.operator-panel-control[data-kind="switch"][data-type="lock_unlock"] .ride-name .tag:after {
  content: "\aUnlock/Lock";
  white-space: pre;
}

.operator-panel-control[data-kind="switch"][data-type="forwards_backwards"] .ride-name .tag:after {
  content: "\aForwards/Backwards";
  white-space: pre;
}

.operator-panel-operator-slot .button,
.operator-panel-control .button {
  margin: 10px auto;
  width: 70px;
  height: 70px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center center;
}

.operator-panel-control[data-kind="button"][data-enabled="true"][data-type="e_stop_activated"] .button {
  background-image: url('../assets/reset_button.png');
  animation: none !important;
}

.operator-panel-control[data-kind="button"][data-type="e_stop"] .button {
  background-image: url('../assets/emergency_button.png');
  animation: none !important;
}

.operator-panel-control[data-kind="button"][data-enabled="true"] .button {
  /*background-image: url('../assets/button_green_on.png');*/
  animation: button-flasher 1s infinite;
}

.operator-panel-control[data-kind="button"] .button {
  background-image: url('../assets/button_green_off.png');
}

.operator-panel-control[data-kind="switch"] .button {
  background-image: url('../assets/switch_1.png');
}

.operator-panel-control[data-kind="switch"][data-on="true"] .button {
  background-image: url('../assets/switch_0.png');
}

.operator-panel-control[data-kind="led"] .button {
  background-image: url('../assets/led_off.png');
}

.operator-panel-control[data-kind="led"][data-on="true"] .button {
  /*background-image: url('../assets/led_on.png');*/
  animation: led-flasher 0.5s infinite;
}

.operator-panel-control[data-kind="led"][data-flashing="true"] .button {
  /*background-image: url('../assets/led_on.png');*/
  animation: led-flasher 0.5s infinite;
}

.operator-control-group {
  /*padding-top: 32px;*/
}

.operator-control-group h3 {
  padding: 0 0 8px 16px;
  margin: 0;
}

@keyframes led-flasher {
  0% {
    background-image: url('../assets/led_on.png');
  }
  30% {
    background-image: url('../assets/led_on.png');
  }
  50% {
    background-image: url('../assets/led_off.png');
  }
  80% {
    background-image: url('../assets/led_off.png');
  }
  100% {
    background-image: url('../assets/led_on.png');
  }
}

@keyframes button-flasher {
  0% {
    background-image: url('../assets/button_green_on.png');
  }
  70% {
    background-image: url('../assets/button_green_on.png');
  }
  80% {
    background-image: url('../assets/button_green_off.png');
  }
  90% {
    background-image: url('../assets/button_green_off.png');
  }
  100% {
    background-image: url('../assets/button_green_on.png');
  }
}
</style>
