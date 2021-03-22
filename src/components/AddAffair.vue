<template>
  <div>
    <div class="content">
      <label for=""
        >Nom de votre affaire:
        <input
          class="name"
          type="text"
          v-model="name"
          placeholder=" nom de l'affaire "
      /></label>
      <label for=""
        >Nom : francky ou Edward ou john
        <input
          class="tech-name"
          type="text"
          v-model="tech_name"
          placeholder="choisissez un nom"
      /></label>
      <label for=""
        >Date de sortie <input type="date" v-model="receipt_date"
      /></label>
      <label for=""
        >Date de retour <input type="date" v-model="return_date"
      /></label>

      <label for=""
        >Nom : francky:32 ou Edward:3 ou john:135
        <input class="tech-id" type="text" v-model="tech_id"
      /></label>
    </div>
    <button class="button3" @click="createAffair">
      Créer une nouvelle affaire
    </button>
  </div>
</template>

<script>
import { ref } from "vue";
import cablageServices from "@/services/cablage.js";
export default {
  name: "AddAffair",

  setup() {
    let name = ref("");
    let tech_name = ref("");
    let tech_id = ref("");
    let receipt_date = ref("");
    let return_date = ref("");

    function createAffair() {
      const data = {
        name: name.value,
        tech_name: tech_name.value,
        tech_id: tech_id.value,
        receipt_date: receipt_date.value,
        return_date: return_date.value
      };
      cablageServices.affairadd(data);
    }
    return {
      name,
      tech_id,
      tech_name,
      createAffair,
      receipt_date,
      return_date
    };
  }
};
</script>

<style scoped>
.content {
  display: flex;
  flex-flow: column wrap;
  text-align: left;
}
.name {
  width: 120px;
}

.tech-id {
  width: 25px;
  margin-bottom: 20px;
}
.tech-name {
  width: 100px;
  margin: 10px;
}
.button3 {
  background-color: rgb(240, 216, 2);
  color: #0c0b0b;
  font-weight: 600;
  box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -webkit-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -moz-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
}
</style>
