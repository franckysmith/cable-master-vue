<template>
  <div>
    <h3>Cables</h3>
    <form @submit.prevent="cableadd">
      <input v-model="name" type="text" placeholder="Nom du cable" /><br />
      <select v-model="type">
        <option v-for="choix in typeChoose" :key="choix.id" :value="choix.value"
          >{{ choix.name }}
        </option>
      </select>
      <br />
      <input v-model="total" type="text" placeholder="Nombre total" /><br />
    </form>
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  name: "Formcable",
  emits: ["creatcable"],

  setup(props, context) {
    const name = ref("");
    const total = ref("");
    const typeChoose = ref([
      {
        id: 1,
        name: "électricité",
        value: "electrical"
      },
      {
        id: 2,
        name: "hp",
        value: "speaker"
      },
      {
        id: 3,
        name: "microphone",
        value: "microphone"
      }
    ]);

    function cableadd() {
      const cable = [
        {
          name: name.value,
          type: type.value,
          total: total.value
        }
      ];
      console.log("cable", cable);
      context.emit("createcable", cable);
      resetForm();
    }

    function resetForm() {
      name.value = "";
      total.value = "";
      type.value = "";
    }

    const type = ref("");
    return {
      name,
      type,
      typeChoose,
      total,
      cableadd
    };
  }
};
</script>

<style scoped>
input {
  margin: 10px;
}
</style>
