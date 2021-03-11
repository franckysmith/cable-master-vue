<template>
  <div>
    <div v-show="isPopUpOpen"><AddCable /></div>
    <div class="post">
      <button @click="selectype('speaker')">HP</button>
      <button value="elec" @click="selectype('electrical')">Elec</button>

      <button value="Module" @click="selectype('module')">Modules</button>
      <button value="Special" @click="selectype('special')">
        Special
      </button>
      <button value="multi" @click="selectype('multi')">
        multis
      </button>
      <button value="Micros" @click="selectype('microphone')">
        Micros
      </button>
      <button value="c_type" @click="selectype('c_type')">
        caisses-type
      </button>
      <button value="" @click="selectype('all')">
        All
      </button>
    </div>
    <div class="ajouter">
      <button @click="isPopUpOpen = true" v-show="!isPopUpOpen">
        Ajouter un élément
      </button>
      <button @click="isPopUpOpen = false" v-show="isPopUpOpen">fermer</button>
    </div>
  </div>
  <div class="home">
    <div class="head">
      <div>tampon</div>
      <div style="padding-left:28px">total</div>
      <div style="padding-left:22px">réservé</div>
    </div>

    <div class="content-number" v-for="cable in cables" :key="cable.cableid">
      <div class="number" v-if="cable.type == typechoose">
        <div class="number">
          <div class="name"><input v-model="cable.name" /></div>
          <div><input v-model="cable.reserved" name="tampon" /></div>
          <div><input v-model="cable.total" name="total" /></div>
          <div><input v-model="cable.reserved" name="reserved" /></div>
          <div>
            <button id="id" :href="cable.link">link</button>
          </div>
          <div>
            <button @click="update_cable(cable)" name="save">save</button>
          </div>
          <div>
            <button @click="delete_cable(cable.cableid)" name="delete">
              delete
            </button>
          </div>
        </div>
        <div class="number2">
          <div><input v-model="cable.info" placeholder="details" /></div>
          <div>
            <input
              style="color:#c9c9c9"
              v-model="cable.link"
              placeholder="link"
            />

            <select v-model="cable.type" @change="update_cable(cable)">
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
      </div>
    </div>
  </div>
</template>

<script>
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";
var api = new Api(url);

import { ref, onMounted } from "vue";

import cablageServices from "@/services/cablage.js";
import AddCable from "@/components/AddCable.vue";
export default {
  name: "Cablemaster",
  components: { AddCable },
  setup() {
    let cables = ref([]);
    let typechoose = ref("speaker");
    let isPopUpOpen = ref("");

    // let ajouter = ref("");
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
        id: 2,
        name: "module",
        value: "module"
      },
      {
        id: 3,
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

    // choose display type (buttons)
    function selectype(data) {
      console.log("typechoose", data);
      typechoose.value = data;
    }

    let cable_get = onMounted(() => {
      api
        .call("cable_get")
        .then(response => {
          cables.value = response;
          console.log("cable_get:", response);
        })
        .catch(response => {
          console.log("err_cable_get:", response);
        });
    });

    function add_cable(data) {
      console.log("cablemaster | cableadd()", data);
      cablageServices.cableadd(data);
    }

    function delete_cable(data) {
      console.log("cablemaster | cabledelete()", data);
      cablageServices.cabledelete([data]);
      cable_get();
    }

    function update_cable(param) {
      console.log("cablemaster | cableupdate", param);
      cablageServices.cableupdate([param]);
    }
    return {
      add_cable,
      update_cable,
      cables,
      delete_cable,
      listeType,
      selectype,
      typechoose,
      cable_get,
      isPopUpOpen
    };
  }
};
</script>
<style scoped>
.head {
  display: flex;
  margin-left: 215px;

  text-align: left;
}
.ajouter {
  margin: 10px;
}
.number {
  display: flex;
  border-width: 0px 0px 1px 0px;
  border-style: solid;
}
.number2 {
  display: flex;
  /* flex: auto 2; */
  margin: 0px 15px 20px;
}
.number2 input {
  margin-right: 15px;
  width: 200px;
}

.number input {
  width: 30px;
  margin: 10px;
}
.number button {
  line-height: 10px;
  padding: 4px;
  margin-top: 10px;
  margin-right: 4px;
}
.list_container {
  width: 400px;
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
  width: 180px;
  margin-left: 15px;
  background-color: #c1c7c33a;
}
</style>
