<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js App" />
    <Formcable @createcable="cableadd" />
  </div>
  <div v-for="cable in cables" :key="cable.cableid">
    {{ cable.name }}
  </div>
</template>

<script>
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";

var api = new Api(url);
// @ is an alias to /src
// import { ref } from "vue";
import HelloWorld from "@/components/HelloWorld.vue";
import Formcable from "@/components/Formcable.vue";
import cablageServices from "@/services/cablage.js";

export default {
  name: "Cablemaster",
  components: {
    HelloWorld,
    Formcable
  },
  setup() {
    function cableadd(data) {
      console.log("Home | cableadd()", data);
      cablageServices.cableadd(data);
    }

    return {
      cableadd
    };
  },

  data() {
    return {
      cables: [],
      name: ""
    };
  },
  mounted() {
    api
      .call("cable_get")
      .then(response => {
        console.log("cable_get:", response);
        this.cables = response;
      })
      .catch(response => {
        console.log("err_cable_get:", response);
      });
  }
};
</script>
