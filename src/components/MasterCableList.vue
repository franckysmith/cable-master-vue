<template>
  <div class="content-number" v-for="cable in allCables" :key="cable.cableid">
    <div class="number">
      <div class="number1">
        <div class="name"><input v-model="cable.name" /></div>
        <div><input v-model="cable.reserved" name="tampon" /></div>
        <div><input v-model="cable.total" name="total" /></div>
        <div><input v-model="cable.weight" name="poids" /></div>
        <div><input v-model="cable.sortno" name="ordre" /></div>
        <button class="delete" @click="suppcable(cable)">delete</button>
      </div>
      <div class="info">
        <input v-model="cable.info" placeholder="details" />
      </div>
      <div class="number2">
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
        <button type="submit" @click="updatecable(cable)" name="save">
          update
        </button>

        <div>
          <input
            class="link"
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
  name: "MasterCableList",
  emits: ["update", "supp", "close"],
  props: {
    cables: {
      type: Array
    }
    // cableType: {
    //   type: String
    // },
    // showMyList: {
    //   type: Boolean
    // },
    // affaireSelected: {
    //   type: Array
    // }
  },

  setup(props, { emit }) {
    let allCables = ref([]);
    let cable = ref([]);
    const displayAddCable = ref("");
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
        name: "autre",
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
    emit("close", displayAddCable);

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
      suppcable,
      displayAddCable
    };
  }
};
</script>

<style scoped>
a {
  color: #1f09e0;
  text-decoration: none;
  /* background-color: rgb(19, 19, 18); */
}
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

.delete {
  margin-left: 5px;
}
.head {
  display: flex;
  margin-left: 140px;
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
  width: 352px;
  text-align: left;
}
.info {
  text-align: left;
}
.name {
  padding: 0px;
}
.name input {
  margin: 0px !important;
}

.list_container {
  width: 375px;
}
.link .modaldelete {
  width: 375px;
  margin: auto;
}
.link {
  width: 80px;
}
.number {
  width: 365px;

  margin: 5px;
}
.number1 {
  display: flex;
  align-items: center;
}

.number2 {
  display: flex;
  align-items: center;
  margin: 5px 0px 25px 0px;
}
.number2 button {
  margin-left: 10px;
}

.number1 input {
  width: 25px;
  margin: 4px;
  align-items: center;
}
.number button {
  /* line-height: 10px; */
  /* padding: 4px; */
  /* margin-top: 10px; */
  margin-right: 8px;
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

  background-color: #c1c7c33a;
}
.selectedtype {
  color: rgb(255, 255, 255);
}

.type {
  /* line-height: 30px; */

  margin: 3px 0px;
}
</style>
