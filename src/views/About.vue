<template>
  <div class="about">
    <h2>
      Page de test
    </h2>
    <div v-for="cable in cables" :key="cable.cableid" class="test">
      {{ cable.name }}
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

<style scoped>
.test {
  text-align: left;
  margin-left: 10px;
}
</style>
