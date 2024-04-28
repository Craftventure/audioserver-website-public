<template>
  <div>
    <md-dialog :md-active="showDialog && !showError" v-bind:md-fullscreen="false">
      <md-dialog-title>Craftventure AudioServer!</md-dialog-title>
      <form>
        <md-dialog-content>
          <div class="md-layout">
            <p class="md-layout-item md-body-1 md-size-100">
              You're one step away from connecting to the AudioServer. Click connect and you're good to go!
            </p>

            <div class="md-layout-item md-size-100" v-if="!authPrefilled">
              <md-field :class="getValidationClass('username')">
                <label for="username">Username</label>
                <md-input name="username" maxlength="16" id="username" v-model="form.username"
                          :disabled="sending"/>
                <span class="md-error"
                      v-if="!$v.form.username.required">The username is required</span>
                <span class="md-error"
                      v-else-if="!$v.form.username.minlength">Invalid username</span>
              </md-field>
            </div>

            <div class="md-layout-item md-size-100" v-if="!authPrefilled">
              <md-field :class="getValidationClass('authCode')">
                <label for="authCode">Authorization code</label>
                <md-input name="authCode" id="authCode" v-model="form.authCode" type="password"
                          :disabled="sending"/>
                <span class="md-error"
                      v-if="!$v.form.authCode.required">The authorization code is required</span>
                <span class="md-error"
                      v-else-if="!$v.form.authCode.minlength">Invalid authorization code</span>
              </md-field>
            </div>

            <md-field v-if="form.server != null">
              <label for="server">Server</label>
              <md-select name="server" id="server" v-model="form.server" md-dense>
                <md-option value="default">Default</md-option>
                <md-option v-bind:value="serverQuery">Third party ({{ serverQuery }})</md-option>
              </md-select>
            </md-field>
          </div>
        </md-dialog-content>
      </form>

      <md-progress-bar md-mode="indeterminate" class="progress-bar" v-if="sending"/>

      <md-dialog-actions>
        <md-button type="submit" class="md-primary" :disabled="sending" @click="connect">Click here to connect
        </md-button>
      </md-dialog-actions>
    </md-dialog>

    <md-dialog :md-active.sync="showError" v-bind:md-fullscreen="false">
      <md-dialog-title>Disconnected</md-dialog-title>
      <md-dialog-content>
        <div class="md-layout">
          <p class="md-layout-item md-body-1" v-if="disconnectedMessage">
            {{ disconnectedMessage }}
          </p>
        </div>
      </md-dialog-content>

      <md-dialog-actions>
        <md-button class="md-primary" @click="showError = false">Close</md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from "vue-property-decorator";
import {validationMixin} from 'vuelidate'
import {helpers, maxLength, minLength, required} from 'vuelidate/lib/validators'
import UrlUtils from "@/assets/urlutils";
import {isSafari} from "@/utils";

const validateUsername = helpers.regex('username', /^[a-zA-Z0-9_]{1,16}$/);

@Component({
  components: {},
  mixins: [validationMixin],
  validations: {
    form: {
      username: {
        required,
        maxLength: maxLength(16),
        minLength: minLength(1),
        validateUsername
      },
      authCode: {
        required,
        minLength: minLength(1)
      }
    }
  }
})
export default class LoginForm extends Vue {
  form = {
    username: null as string | null,
    authCode: null as string | null,
    server: null as string | null
  }
  authPrefilled = false
  showError = false
  serverQuery: string | null = null

  get showDialog() {
    return !this.$audioServer.state.isConnected || !this.$audioServer.state.isVerified;
  }

  get sending() {
    return this.$audioServer.state.isConnecting;
  }

  get disconnectedMessage() {
    return this.$audioServer.state.disconnectedMessage;
  }

  @Watch('disconnectedMessage')
  onDisconnectedMessageChanged(newMessage: string) {
    if (newMessage !== null && typeof newMessage !== 'undefined')
      this.showError = true;
  }

  connect() {
    if (isSafari()) {
      alert("It looks like you're using Safari. Safari may work, but using Chrome/Firefox is recommended")
      let audio = new Audio("https://cdn.craftventure.net/audio/whitenoise.mp3");
      audio.crossOrigin = 'anonymous'
      audio.play()
    }

    this.$audioServer.audioContext.resume()
    this.$v.$touch();
    if (!this.$v.$invalid) {
      this.$audioServer.connect(
          this.$data.form.username,
          this.$data.form.authCode,
          this.$data.form.server != 'null' && this.$data.form.server != 'default' ? this.$data.form.server : null
      );
    }
  }

  getValidationClass(fieldName: string) {
    const field = this.$v.form[fieldName];

    if (field) {
      return {
        'md-invalid': field.$invalid && field.$dirty
      }
    }
  }

  mounted() {
    this.form.username = UrlUtils.getParam('username');
    this.form.authCode = UrlUtils.getParam('auth');

    this.authPrefilled = this.form.username != null && this.form.authCode != null;

    this.serverQuery = UrlUtils.getParam('socket') || null;
    this.form.server = this.serverQuery;
  }
}
</script>

<style scoped>
.progress-bar {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
}
</style>
