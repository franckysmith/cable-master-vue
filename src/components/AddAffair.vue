<template>
  <slot></slot>
  <form class="content">
    <div class="content-form">
      <label for=""
        >Nom de votre affaire:
        <input
          class="name"
          type="text"
          v-model.lazy="name"
          placeholder=" nom de l'affaire "
          autocomplete="off"
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
      <button class="button3" @click="createAffair">Enregistrer</button>
      <button class="button2" @click="newAffairClose">
        fermer
      </button>
    </div>
  </form>
</template>

<script>
import { ref } from "vue";
import cablageServices from "@/services/cablage.js";
export default {
  name: "AddAffair",
  emits: ["listenclosenewaff", "showcreatedaff", "listenopennewaff"],
  setup(_, context) {
    const name = ref("");
    const tech_name = ref("");
    const tech_id = ref("");
    const receipt_date = ref("");
    const return_date = ref("");
    const newAffairIsClose = ref("");
    // const newAffairOpen = inject("openAffaire");

    function newAffairClose() {
      newAffairIsClose.value = false;
      context.emit("listenclosenewaff", newAffairIsClose.value);
      // console.log("newAffairIsClose", newAffairIsClose.value);
    }

    async function createAffair() {
      const data = {
        name: name.value,
        tech_name: tech_name.value,
        tech_id: tech_id.value,
        receipt_date: receipt_date.value,
        return_date: return_date.value
      };
      const res = await cablageServices.affairadd(data);
      console.log("createAffair() | res", res);
      context.emit("listenclosenewaff", false);
      context.emit("showcreatedaff", res);
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
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
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
