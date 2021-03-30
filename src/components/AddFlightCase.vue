<template>
  <div class="content">
    <form>
      <div>
        <input type="text" v-model="name" placeholder="Nom de la caisse" />
        <input type="textarea" v-model="info" placeholder="détails" />
      </div>

      <div><button type="submit" @click="createFc">New</button></div>
    </form>
  </div>
</template>

<script>
import { ref } from "vue";
import cablageServices from "@/services/cablage.js";

export default {
  name: "AddFlightCase",

  setup() {
    let name = ref("");
    let info = ref("");

    function createFc() {
      const data = {
        name: name.value,
        info: info.value
      };
      cablageServices.mfcadd(data);
    }
    return {
      createFc,
      name,
      info
    };
  }
};
</script>

<style scoped>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
