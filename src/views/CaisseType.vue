<template>
  <div class="addflfightcase"><AddFlightCase /></div>

  <div class="ct-content">
    <div>
      <select v-model="caisseSelected" @change="caisseToList(caisseSelected)">
        <option
          v-for="caissetype in mfc"
          :key="caissetype.mfcid"
          :value="caissetype"
          placeholder="choisir"
          >{{ caissetype.name }}
        </option>
      </select>
      <div>
        <input
          class="ct-info"
          type="textarea"
          v-model="caisseSelected.info"
          placeholder="pas d'information"
          cols="2"
          rows="3"
        />
      </div>
    </div>
  </div>

  <div class="content-liste">
    ----------------------
    <h3>Listes cables etc ...</h3>

    <div class="post">
      <button @click="selectype('speaker')">HP</button>
      <button @click="selectype('electrical')">Elec</button>
      <button @click="selectype('module')">Modules</button>
      <button @click="selectype('special')">Spéciaux</button>
      <button @click="selectype('other')">autres</button>
      <button @click="selectype('microphone')">Micros</button>
      <button @click="selectype('c_type')">caisses-type</button>
      <button @click="selectype('accessory')">accessoires</button>
      <button @click="selectype('digital')">numériques</button>

      <div>
        <!-- celectype('microphone'+'digital'+'other' ..... ) -->
        <button @click="filtreMaliste">All</button>
        <input
          type="text"
          v-model="searchKey"
          placeholder="Rechercher un élément"
        />
        <!-- Rounded switch -->
        <label class="toggle-label" v-if="cableLayoutData == 'flightcase'">
          ma liste
          <label class="switch">
            <input type="checkbox" />
            <span class="sliderder round"></span>
          </label>
        </label>
        <label class="toggle-label" v-if="cableLayoutData == 'cableTechBase'">
          All ..... ma liste
          <label class="switch">
            <input type="checkbox" @click="filtreMaliste" />
            <span class="slider round"></span>
          </label>
        </label>
      </div>
    </div>
    <form @submit.prevent="mfcupdate(caissetype)">
      <button class="button2" type="submit">
        Update
      </button>

      <div class="content-number">
        <div v-for="cable in allCable" :key="cable.cableid">
          <div v-if="cable.type == typechoose">
            <div class="number">
              <div class="name">
                <h4>{{ cable.name }}</h4>
              </div>

              <div>
                <input name="count" v-model="cable.count" />
              </div>
            </div>
            <div class="info-content">
              <div class="info">
                <p>{{ cable.info }}</p>
                <button type="button" class="link">
                  <a href="cable.link">link</a>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>

  <!-- <div><button>getorder</button></div>
  <div v-for="order in orders" :key="order.orderid">
    {{ order.count }} {{ order.cableid }}
  </div> -->
</template>
<script>
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";
var api = new Api(url);
import cablageServices from "@/services/cablage.js";
import AddFlightCase from "@/components/AddFlightCase.vue";

import { ref, computed, onMounted } from "vue";

export default {
  name: "CaisseType",
  components: { AddFlightCase },

  setup() {
    let allCables = ref([]);
    let cables = ref([]);
    let caisses = ref([]);
    let typechoose = ref("speaker");
    // let cable = ref("");
    let count = ref("");
    let cableid = ref("");
    let cableLayoutData = ref("cableTechBase");
    let cableIdsInMfc = ref([]);
    let cableMfcTechJoinedData = ref([]);
    let cableTechBase = ref("");
    let caisseSelected = ref("");
    let caissetype = ref([]);
    let mfc = ref([]);
    let cablemfc = ref([]);
    let calculateTotal = ref("");
    let showMyList = ref(false);
    // let searchbycaisse = ref([]);

    // --- filtrer liste ----------------------------
    function filtreMaliste() {
      showMyList.value = !showMyList.value;
      console.log("cables", cablesNonZero);
    }
    allCables = computed(() => {
      if (showMyList.value) {
        return cableMfcTechJoinedData.value.filter(c => calculateTotal(c) > 0);
      }
      return cableMfcTechJoinedData.value;
    });

    // --------------  cableNonZero ---------------
    const cablesNonZero = computed(() => {
      console.log(
        "cablesNonZero | searchInCableTechJoinData.value",
        searchInCableTechJoinData.value
      );
      return searchInCableTechJoinData.value.filter(c => c.count > 0);
    });

    // ----------- get caisses -------//

    // let mfc_get = onMounted(() => {
    //   cablageServices.mfcread();
    //   console.log("mfc_get | ", mfc);
    // });

    let mfc_get = onMounted(() => {
      api
        .call("mfc_get")
        .then(response => {
          mfc.value = response;
        })
        .catch(response => {
          console.log("mfc_get:", response);
        });
    });
    // ------------ get cable --------
    api
      .call("cable_get")
      .then(response => {
        console.log("cable_get:", response);
        cables.value = response;
      })
      .catch(response => {
        console.log("err_cable_get:", response);
      });
    //-------------------------------

    // cablemfc get with selected mfc

    function caisseToList(data) {
      //   cableIdsInOrders.value = [];
      //   cableTechJoinedData.value = [];

      api
        .call("cablemfc_get", data)
        .then(response => {
          console.log("cablemfc_get::", response);
          cablemfc.value = response;

          // create a view-model joining order items and cables

          aggregateData(response, cables.value);
        })
        .catch(function(response) {
          console.log("er_cablemfc_get", response);
        });
    }

    // aggregateData table 'cables' et 'cablemfc'
    function aggregateData(cablemfc, cables) {
      cablemfc.forEach(o => {
        cableIdsInMfc.value.push(o.cableid);
        console.log("cableIdsInMfc!!", cableIdsInMfc);
      });

      cables.forEach(cable => {
        let line = {
          name: cable.name,
          count: 0,
          total: cable.total,
          link: cable.link,
          info: cable.info,
          type: cable.type
        };

        if (cableIdsInMfc.value.includes(cable.cableid)) {
          const cablemfcItem = cablemfc.find(o => o.cableid === cable.cableid);

          line = {
            name: cable.name,
            count: cablemfcItem.count,
            total: cable.total,
            link: cable.link,
            info: cable.info,
            type: cable.type
          };
        }

        cableMfcTechJoinedData.value = [...cableMfcTechJoinedData.value, line];
      });

      console.log("cableMfcTechJoinedData.value", cableMfcTechJoinedData.value);
    }

    // choose display cable_type (buttons)
    function selectype(data) {
      console.log("typechoose", data);
      typechoose.value = data;
    }

    // --------- mfc --------//
    // save/update updatemfc
    function mfcupdate(data) {
      api
        .call("mfc_update", data)
        .then(function(response) {
          console.log("mfc_update:");
          console.log(response);
        })
        .catch(function(response) {
          console.log("mfc_update:");
          console.log(response);
        });
    }
    // function updatemfc(param) {
    //   console.log("caisse | updatemfc:", param);
    //   cablageServices.mfcupdate([param]);
    // }

    // delete mfc

    function deletemfc(param) {
      console.log("caisse | deletemfc", param);
      cablageServices.mfcdelete({ mfcid: param });
      mfc_get();
    }

    // ---- recherche dans liste cable par searchKey
    let searchKey = ref("");

    const searchInCableTechJoinData = computed(() => {
      console.log("searchInCableTechJoinData:", searchInCableTechJoinData);
      return cableMfcTechJoinedData.value.filter(cable => {
        return cable.name.toLowerCase().includes(searchKey.value.toLowerCase());
      });
    });

    return {
      allCables,
      cables,
      caisseToList,
      mfcupdate,
      deletemfc,
      searchKey,
      caisses,
      selectype,
      typechoose,
      count,
      cableid,
      cableIdsInMfc,
      cableMfcTechJoinedData,
      cablemfc,
      cableLayoutData,
      cableTechBase,
      caisseSelected,
      caissetype,
      calculateTotal,
      filtreMaliste,
      mfc
    };
  }
};
</script>
<style scoped>
.addflfightcase {
  margin: 10px;
}
button {
  margin: 3px;
}
.button2 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #eca809;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.button3 {
  background-color: rgb(240, 216, 2);
  color: #0c0b0b;
  font-weight: 600;
  box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -webkit-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -moz-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
}

.content-liste {
  margin: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content-number {
  width: 70px;
  height: 45px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ct-content {
  display: flex;

  margin: auto;
  width: 400px;
  flex-wrap: wrap;
  /* margin: auto; */
}
.ctct-content {
  display: flex;
  justify-content: space-between;
  width: 370px;
  margin: 5px;
}
.ct-name {
  width: 120px;
  padding-right: 10px;
  /* flex-wrap: wrap; */
  font-weight: 500;
}
.ct-info {
  width: 370px;
}
input {
  padding: 5px;
}
.info {
  font-size: 12px;
  height: 15px;
  width: 350px;
  display: flex;
  justify-content: space-between;
  text-align: left;
  /* padding: 0px; */
  margin: 0px 0px 5px 30px;
}
.info-content {
  display: flex;
  border-bottom: 1px solid black;
  width: 370px;
}
.info-content p {
  margin: 0px;
}

.head {
  display: flex;
  /* margin: auto; */
  width: 400px;

  text-align: left;
  padding-left: 155px;
}
.link {
  height: 18px;
  background: transparent;
  border: 1px solid grey;
  color: grey;
  /* line-height: 10; */
}
.list {
  margin: 5px 25px;
  display: flex;
  text-align: left;
}

.list input {
  margin: 0px 10px;
  width: 30px;
}
.list_name {
  width: 220px;
}
.list_container {
  width: 400px;
}
.name {
  height: 10px;
}
.name h4 {
  font-size: 15px;
  font-weight: 700;
  text-align: left;
  width: 110px;
  padding: 1px 1px 1px 3px;
  background-color: #c1c7c33a;
  border-left: 5px solid #4dcc59;
}

.number {
  display: flex;
  border-width: 0px 0px 1px 0px;
  align-content: flex-start;
}

.number input {
  width: 18px;
  margin: 6px;
}
.number button {
  line-height: 10px;
  padding: 4px;
  margin-top: 10px;
  margin-right: 4px;
}

.post {
  margin: 10px 0px 20px 0px;
  width: 400px;
}

.post button {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #4dcc59;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
#save-liste {
  background-color: rgb(240, 216, 2);
  color: #0c0b0b;
  font-weight: 600;
  box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -webkit-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -moz-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
}
/* ------------------------------------------------------------------- */
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 32px;
  margin-left: 8px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(216, 211, 207);
  /* background-color: rgb(224, 119, 20); */
  -webkit-transition: 0.4s;
  transition: 0.4s;
  border: 2px solid rgb(13, 216, 47);
}
.sliderder {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* background-color: rgb(216, 211, 207); */
  background-color: rgb(224, 119, 20);
  -webkit-transition: 0.4s;
  transition: 0.4s;
  border: 2px solid rgb(13, 216, 47);
}

.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: rgb(224, 119, 20);
  /* background-color: rgb(216, 211, 207); */
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196f3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round,
.sliderder.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
.toggle-label {
  display: block;
  float: right;
  width: 100px;
  font-size: 12px;
  padding-left: 10px;
}
</style>
