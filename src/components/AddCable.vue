<template>
  <form class="contener">
    <div>
      <div>
        <div class="head">
          <input
            class="name"
            v-model="name"
            :class="[name.length >= 3 ? 'valid' : 'validno']"
            placeholder="Nouvel élément"
          />

          <label for=""
            >Disponibles:<input
              class="dispo"
              v-model="total"
              :class="[total.length >= 1 ? 'valid' : 'validno']"
          /></label>
          <label for=""
            >Alerte:
            <input
              class="seuil"
              v-model="reserved"
              :class="[reserved.length >= 1 ? 'valid' : 'validno']"
          /></label>
        </div>

        <div class="type">
          <label for="">Choisir une catégorie :</label>
          <select
            v-model="type"
            :class="[type.length >= 1 ? 'valid' : 'validno']"
          >
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
        <input v-model="info" placeholder="info" />
        <input v-model="link" placeholder="Link" />
      </div>
    </div>

    <div>
      <button class="ajouter" @click="add_cable">ajouter</button>
      <button type="buton" @click="displayAddCable = false">fermer</button>
    </div>
  </form>
  ----------------------
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
        name: "other",
        value: "other"
      },
      {
        id: 7,
        name: "c_type",
        value: "c_type"
      },
      {
        id: 8,
        name: "accessoire",
        value: "accessory"
      },
      {
        id: 9,
        name: "numérique",
        value: "digital"
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
.ajouter {
  margin: 10px;
  background: red;
  padding: 5px;
}
.contener {
  background: rgb(224, 223, 222);
  padding: 1rem;
  max-width: 400px;
  margin: auto;
}
.dispo {
  width: 20px;
}
.head {
  display: flex;
  justify-content: space-between;
}

.info .link {
  width: 40px;
  margin: 10px;
}
.infolink input {
  margin: 10px;
  width: 315px;
  /* margin-right: 10px; */
}
.name {
  width: 110px;
}

.seuil {
  width: 20px;
}
.type {
  margin-top: 10px;
}
.valid {
  background-color: lightgreen;
}
.validno {
  border: 2px solid red;
}
</style>
