<template>
  <div class="about">
    <h1>CableTech page</h1>
    <p>cette page utilise services/cablage.js</p>
    <p>sensé voir liste de cable comme dans about</p>
    <div v-for="cable in cables" :key="cable.cableid">
      type de cables : {{ cable.name }}
    </div>
  </div>
</template>
<script>
import cablageServices from "@/services/cablage.js";

export default {
  name: "cabletech",
  data() {
    return {
      cables: [{}]
    };
  },
  mounted() {
    this.cables = cablageServices.cableread();
    console.log("cabletech | mounted", this.cables.data);
  }
};
</script>
