<template>
  <div classe="contener">
    <form>
      <div class="form">
        <div class="form1">
          <div class="number">
            <input v-model="name" placeholder="Nouvel élément" />

            <input id="case" v-model="total" placeholder="dispo" />
            <input id="case2" v-model="reserved" placeholder="tampon" />
          </div>

          <div class="menuder">
            <select v-model="type">
              <option
                v-for="choix in listeType"
                :key="choix.id"
                :value="choix.value"
                :placeholder="choix.value"
                >{{ choix.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="infolink">
          <input v-model="info" placeholder="info" />
          <input v-model="link" placeholder="Link" />
        </div>
      </div>

      <div>
        <button @click="add_cable" id="enregistrer">enregistrer</button>
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
    const total = ref("");
    const type = ref("");
    const name = ref("");
    const link = ref("");
    const info = ref("");
    const reserved = ref("");

    function add_cable() {
      const data = [
        {
          name: name.value,
          type: type.value,
          total: total.value,
          link: link.value,
          info: info.value,
          reserved: reserved.value
        }
      ];
      cablageServices.cableadd(data);
    }

    return {
      add_cable,
      cables,
      listeType,
      typechoose,
      name,
      type,
      total,
      info,
      link,
      reserved
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
  width: 180px;
  margin-left: 15px;
  background-color: #c1c7c33a;
}
#enregistrer {
  margin: 10px;
  background: red;
}
</style>
