<template>
  <div class="content-number" v-for="cable in allCables" :key="cable.cableid">
    <div class="number">
      <div class="number1">
        <div class="name"><input v-model="cable.name" /></div>
        <div><input v-model="cable.reserved" name="tampon" /></div>
        <div><input v-model="cable.total" name="total" /></div>
        <div><input v-model="cable.weight" name="poids" /></div>
        <div><input v-model="cable.sortno" name="ordre" /></div>
        <div class="type">
          <select v-model="cable.type" @change="updatecable(cable)">
            <option
              v-for="choix in listeType"
              :key="choix.id"
              :value="choix.value"
              >{{ choix.name }}
            </option>
          </select>
        </div>
        <button>
          <a :href="cable.link">link</a>
        </button>

        <div>
          <button type="submit" @click="updatecable(cable)" name="save">
            update
          </button>
        </div>

        <div>
          <div>
            <button @click="suppcable(cable)">delete</button>
          </div>
        </div>
      </div>
      <div class="number2">
        <div class="info">
          <input v-model="cable.info" placeholder="details" />
        </div>
        <div>
          <input
            style="color:#c9c9c9"
            v-model="cable.link"
            placeholder="http://www.demo.fr"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from "vue";

export default {
  emits: ["update", "supp"],
  props: {
    cables: {
      type: Array
    },
    cableType: {
      type: String
    },
    showMyList: {
      type: Boolean
    },
    affaireSelected: {
      type: Array
    }
  },

  setup(props, { emit }) {
    let allCables = ref([]);
    let cable = ref([]);
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

    function updatecable(param) {
      emit("update", param);
    }
    function suppcable(param) {
      emit("supp", param);
    }

    function calculateTotal(cable) {
      return (
        parseInt(cable.spare_count) +
        parseInt(cable.z1 || 0) +
        parseInt(cable.z2 || 0) +
        parseInt(cable.z3 || 0) +
        parseInt(cable.z4 || 0) +
        parseInt(cable.z5 || 0)
      );
    }

    allCables = computed(() => {
      if (props.showMyList) {
        return props.cables.filter(c => calculateTotal(c) > 0);
      }
      return props.cables;
    });
    function setColorIndicator(cable) {
      if (cable.total > 10) {
        return "available-info";
      } else if (cable.total > 5) {
        return "available-warning";
      } else {
        return "available-alert";
      }
    }

    return {
      calculateTotal,
      allCables,
      setColorIndicator,
      listeType,
      emit,
      updatecable,
      cable,
      suppcable
    };
  }
};
</script>

<style scoped>
.ajouter {
  margin: 10px;
}
button {
  cursor: pointer;
  height: 22px;
}
.button3 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #eb910a;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

a {
  color: #1f09e0;
  text-decoration: none;
  /* background-color: rgb(19, 19, 18); */
}
.head {
  display: flex;
  margin-left: 160px;
  text-align: left;
  font-size: 12px;
}
.home {
  /* margin: auto; */
  display: flex;
  flex-direction: column;
  align-items: center;

  height: 90vh;
}
.info input {
  width: 400px;
}
.list_container {
  width: 400px;
}
.modaldelete {
  width: 400px;
  margin: auto;
}
.number {
  width: 620px;
  border-width: 0px 0px 1px 0px;
  /* border-style: solid; */
  margin: 5px;
}
.number1 {
  display: flex;
}

.number2 {
  display: flex;
  /* flex: auto 2; */
  margin: 0px 15px 20px;
}
.number2 input {
  margin-right: 15px;
  /* width: 100px; */
}

.number1 input {
  width: 30px;
  margin: 4px;
}
.number button {
  line-height: 10px;
  padding: 4px;
  margin-top: 10px;
  margin-right: 4px;
}

.post button {
  margin: 3px;
  padding: 5px;
  min-width: 50px;
  background: #4dcc59;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

.name input {
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  width: 110px;
  margin-left: 15px;
  background-color: #c1c7c33a;
}
.selectedtype {
  color: rgb(255, 255, 255);
}

.type {
  line-height: 30px;

  margin: 5px;
}
</style>
