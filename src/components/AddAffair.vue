<template>
  <div class="content">
    <div class="content-form">
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
    <div class="buttons-save">
      <button class="button3" @click="createAffair">
        Enregistrer
      </button>
      <button class="button2" @click="newAffairClose">
        fermer
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import cablageServices from "@/services/cablage.js";
export default {
  name: "AddAffair",
  emit: ["lesson-fermer-newAff"],
  setup(_, context) {
    let name = ref("");
    let tech_name = ref("");
    let tech_id = ref("");
    let receipt_date = ref("");
    let return_date = ref("");
    let newAffairIsClose = ref("");
    // const newAffairOpen = inject("openAffaire");

    function newAffairClose() {
      newAffairIsClose.value = false;
      context.emit("lesson-fermer-newAff", newAffairIsClose.value);
      console.log("newAffairIsClose", newAffairIsClose.value);
    }

    function createAffair() {
      const data = {
        name: name.value,
        tech_name: tech_name.value,
        tech_id: tech_id.value,
        receipt_date: receipt_date.value,
        return_date: return_date.value
      };
      cablageServices.affairadd(data);
      context.emit("lesson-fermer-newAff", false);
    }
    return {
      name,
      tech_id,
      tech_name,
      createAffair,
      receipt_date,
      return_date,
      newAffairClose
      // newAffairOpen
    };
  }
};
</script>

<style scoped>
.buttons-save {
  display: flex;
  justify-content: space-evenly;
}
.content {
  width: 400px;
}
.content-form {
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
button {
  cursor: pointer;
}
.button3 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: rgb(240, 216, 2);
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.button2 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #c9c6bf;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
</style>
