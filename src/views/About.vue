<template>
  <div class="about">
    <h2>
      about page avec une list de Cables sans utiliser la composition api et
      "services"
    </h2>
    <div v-for="cable in cables" :key="cable.cableid">
      type de cables : {{ cable.name }}
    </div>
  </div>
</template>
<script>
// import cablageServices from "@/services/cablage.js";
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";

var api = new Api(url);

export default {
  name: "about",
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
