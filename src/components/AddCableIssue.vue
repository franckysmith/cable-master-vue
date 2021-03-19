<template>
  <div classe="contener">
    <form @submit.prevent="add_cable(cable)">
      <div class="form">
        <div class="form1">
          <div class="number">
            <input v-model="cable.name" placeholder="Nouvel élément" />

            <input id="case" v-model.number="cable.total" placeholder="dispo" />
            <input
              id="case2"
              v-model.number="cable.reserved"
              placeholder="tampon"
            />
          </div>

          <div class="menuder">
            <select v-model="cable.type">
              <option value="choisir" placeholder="choisir"></option>
              <option
                v-for="choix in listeType"
                :key="choix.id"
                :value="choix.value"
                >{{ choix.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="infolink">
          <input v-model="cable.info" placeholder="info" />
          <input v-model="cable.link" placeholder="Link" />
        </div>
      </div>

      <div>
        <button type="submit" id="enregistrer">enregistrer</button>
      </div>
    </form>
    ----------------------
  </div>
</template>

<script>
import { ref } from "vue";

import cablageServices from "@/services/cablage.js";

export default {
  name: "AddCable",

  setup() {
    let cables = ref([]);
    let cable = ref([]);
    let typechoose = ref("");
    const listeType = ref([
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
      },
      {
        id: 4,
        name: "module",
        value: "module"
      },
      {
        id: 5,
        name: "special",
        value: "special"
      },
      {
        id: 6,
        name: "multi",
        value: "multi"
      },
      {
        id: 7,
        name: "c_type",
        value: "c_type"
      }
    ]);

    function add_cable(data) {
      debugger;
      console.log("cableadd | ", data);
      cablageServices.cableadd([data]);
    }

    return {
      add_cable,
      cables,
      listeType,
      typechoose,

      cable
    };
  }
};
</script>
<style scoped>
.contener {
  padding: 100px 10px;
}
.head {
  display: flex;
  flex-direction: column;
  margin-left: 20px;

  text-align: left;
}
.menuder {
  margin: 5px;
  font-size: 25px;
}
.form1 {
  display: flex;
}

.form {
  display: flex;
  flex-direction: column;
  text-align: left;
}
#case,
#case2 {
  width: 40px;
  margin: 10px;
}
.infolink input {
  width: 250px;
  margin-right: 10px;
}

.name input {
  font-size: 10px;
  font-weight: 600;
  text-align: left;
  width: 120px;
  margin-left: 15px;
  background-color: #c1c7c33a;
}
#enregistrer {
  margin: 10px;
  background: red;
}
</style>
