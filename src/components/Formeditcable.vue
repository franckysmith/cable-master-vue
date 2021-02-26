<template>
  <div>
    <h3>Edit Cable</h3>
    <form @submit.prevent="editcable">
      <input v-model="name" type="text" placeholder="Nom du cable" /><br />
      <select v-model="type">
        <option v-for="choix in typeChoose" :key="choix.id" :value="choix.value"
          >{{ choix.name }}
        </option>
      </select>
      <br />
      <input v-model="total" type="text" placeholder="Nombre total" /><br />
      <button>update</button>
    </form>
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  name: "Formeditcable",
  emits: ["editcable"],
  props: {
    cable: { required: true }
  },
  setup(props, context) {
    const cableid = ref("");
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

    function cableupdate() {
      const cable = [
        {
          cableid: cableid.value,
          name: name.value,
          type: type.value,
          total: total.value
        }
      ];
      console.log("cable", cable);
      context.emit("editcable", cable);
    }

    const type = ref("");
    return {
      cableid,
      name,
      type,
      typeChoose,
      total,
      cableupdate
    };
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
