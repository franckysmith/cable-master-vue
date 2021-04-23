<template>
  <div class="content">
    <form>
      <div>
        <input type="text" v-model="name" placeholder="Nom de la caisse" />
        <textarea cols="30" rows="2" v-model="info" placeholder="détails" />
      </div>

      <div>
        <label
          >Ajouter une nouvelle caisse :
          <button type="submit" @click="createFc">
            Ajouter
          </button></label
        >
      </div>
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
.content input,
button {
  margin: 10px;
}
</style>
