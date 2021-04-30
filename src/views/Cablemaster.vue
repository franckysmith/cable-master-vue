<template>
  <div class="modaldelete">
    <ModalDelete @close="isOpen = false" v-if="isOpen">
      <template v-slot:main>
        <div v-for="cable in cableToDelete" :key="cable">
          <h1>{{ cable.name }}</h1>
          <button
            class="modal-default-button"
            @click="delete_cable(cable.cableid)"
          >
            supprimer
          </button>
        </div>
      </template>
      <template #footer>
        <button class="buttonv" @click="isOpenClose">
          non
        </button>
      </template>
    </ModalDelete>
  </div>

  <div>
    <div v-show="displayAddCable"><AddCable /></div>

    <div class="post">
      <button
        @click="selectype('speaker')"
        :class="typechoose === 'speaker' ? 'selectedtype' : ''"
      >
        HP
      </button>
      <button
        @click="selectype('electrical')"
        :class="typechoose === 'electrical' ? 'selectedtype' : ''"
      >
        Elec
      </button>
      <button
        @click="selectype('module')"
        :class="typechoose === 'module' ? 'selectedtype' : ''"
      >
        Modules
      </button>
      <button
        @click="selectype('special')"
        :class="typechoose === 'special' ? 'selectedtype' : ''"
      >
        Spéciaux
      </button>
      <button
        @click="selectype('other')"
        :class="typechoose === 'other' ? 'selectedtype' : ''"
      >
        autres
      </button>
      <button
        @click="selectype('microphone')"
        :class="typechoose === 'microphone' ? 'selectedtype' : ''"
      >
        Micros
      </button>
      <button
        @click="selectype('c_type')"
        :class="typechoose === 'c_type' ? 'selectedtype' : ''"
      >
        caisses-type
      </button>
      <button
        @click="selectype('accessory')"
        :class="typechoose === 'accessory' ? 'selectedtype' : ''"
      >
        accessoires
      </button>
      <button
        @click="selectype('digital')"
        :class="typechoose === 'digital' ? 'selectedtype' : ''"
      >
        numériques
      </button>

      <button
        @click="selectype('')"
        :class="typechoose === '' ? 'selectedtype' : 'button'"
      >
        All
      </button>
    </div>
  </div>
  <div class="ajouter">
    <button
      class="button3"
      @click="displayAddCable = true"
      v-show="!displayAddCable"
    >
      Ajouter un élément
    </button>
    <button @click="displayAddCable = false" v-show="displayAddCable">
      fermer
    </button>
    <input
      type="text"
      v-model="searchKey"
      placeholder="Rechercher un élément"
    />
  </div>
  <div class="home">
    <div>
      <div class="head">
        <div style="padding-left:0px">seuil</div>
        <div style="padding-left:16px">total</div>
        <div style="padding-left:16px">poids</div>
        <div style="padding-left:16px">ordre</div>
      </div>
      <div>
        <div v-if="typechoose !== ''">
          <MasterCableList
            @supp="suppcable"
            @update="update_cable"
            :cables="filteredCableByType"
            :cable-type="typechoose"
          />
        </div>
        <div v-else>
          <MasterCableList
            @supp="delete_cable"
            :cables="search"
            cable-type=""
            @update="update_cable"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";
var api = new Api(url);

import { ref, onMounted, computed } from "vue";

import ModalDelete from "@/components/ModalDelete.vue";
import cablageServices from "@/services/cablage.js";
import AddCable from "@/components/AddCable.vue";
import MasterCableList from "@/components/MasterCableList.vue";

export default {
  name: "Cablemaster",
  components: { AddCable, ModalDelete, MasterCableList },

  setup() {
    let cables = ref([]);
    let typechoose = ref("speaker");
    let displayAddCable = ref(false);
    let sureToDelete = ref("");
    let cable = ref([]);
    let isModalDelete = ref(false);
    let isOpen = ref("");
    let cableToDelete = ref([]);
    let searchKey = ref("");
    let searchInCableTechJoinData = ref([]);
    let showMyList = ref([]);

    // choose display cable_type (buttons) --------------------------
    function selectype(data) {
      console.log("typechoose", data);
      typechoose.value = data;
    }

    // ---- search by searchKey -----------------
    const search = computed(() => {
      return cables.value.filter(cable => {
        return cable.name.toLowerCase().includes(searchKey.value.toLowerCase());
      });
    });

    const filteredCableByType = computed(() => {
      return search.value.filter(c => c.type === typechoose.value);
    });

    // --- filtrer liste
    function filtreMaliste() {
      showMyList.value = !showMyList.value;
      console.log("cables", showMyList.value);
    }

    // get cable ---------------------------------------
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

    //suppresion cable => modalDelete --------------
    const suppcable = function(data) {
      cableToDelete.value = [data];
      console.log("suppCable", data);
      isOpen.value = true;
    };
    // ajouter un cable
    function add_cable(data) {
      console.log("cablemaster | cableadd()", data);
      cablageServices.cableadd(data);
      cablageServices.cableread();
    }
    // effacer un cable
    function delete_cable(data) {
      console.log("cablemaster | cabledelete()", data);
      cablageServices.cabledelete([data]);
      cablageServices.cableread();
    }
    // update un cable
    function update_cable(param) {
      console.log("cablemaster | cableupdate", param);
      cablageServices.cableupdate([param]);
      cablageServices.cableread();
    }
    // -----------------------------------------------
    return {
      add_cable,
      cable,
      cables,
      cableToDelete,
      delete_cable,
      filteredCableByType,
      filtreMaliste,

      selectype,
      typechoose,
      cable_get,
      displayAddCable,
      sureToDelete,
      searchInCableTechJoinData,
      suppcable,
      isOpen,
      isModalDelete,
      ModalDelete,
      showMyList,
      search,
      searchKey,
      update_cable
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
}
.buttonv {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #4dcc59;

  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
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
.head {
  display: flex;
  margin-left: 128px;
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
  width: 370px;
}
.list_container {
  width: 370px;
}
.modal-default-button {
  /* width: 400px; */
  margin: 15px;
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
