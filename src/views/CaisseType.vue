<template>
  <div class="addflfightcase"><AddFlightCase /></div>
  <div v-for="caissetype in mfc" :key="caissetype.mfcid">
    <div class="ct-content">
      <div class="ctct-content">
        <input class="ct-name" type="text" v-model="caissetype.name" />
        <button class="button" @click="deletemfc(caissetype)">delete</button>
        <button class="button" @click="caisseToList(caissetype)">select</button>
      </div>
      <div>
        <input
          class="ct-info"
          type="textarea"
          v-model="caissetype.info"
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
        <button @click="selectype('')">All</button>
        <input
          type="text"
          v-model="searchKey"
          placeholder="Rechercher un élément"
        />
      </div>
    </div>
    <form @submit.prevent="mfcupdate(caissetype)">
      <button class="button2" type="submit">
        Update
      </button>

      <button class="button2" @click="filtreMaliste">ma liste</button>

      <div class="content-number">
        <div v-for="cable in cableMfcTechJoinedData" :key="cable.cableid">
          <!-- ------------ v-if="cable.count > 0" -->
          <!----------- v-if="filterCable" ------->
          <div v-if="cable.type == typechoose">
            <div class="number">
              <div class="name">
                <h4>{{ cable.name }}</h4>
              </div>

              <div>
                <input name="spare_count" v-model="cable.count" />
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
    let mfc = ref([]);
    let cablemfc = ref([]);
    // let searchbycaisse = ref([]);

    // ------------------------------------

    // cablemfc get with selected mfc
    function caisseToList(data) {
      //   cableIdsInOrders.value = [];
      //   cableTechJoinedData.value = [];

      let searchbycaisse = data;
      api
        .call("cablemfc_get", searchbycaisse)
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
      });

      cables.forEach(cable => {
        let line = {
          name: cable.name,
          count: "",
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
      cablageServices.mfcdelete(param);
      mfc_get();
    }

    // ---- recherche dans liste cable par searchKey
    let searchKey = ref("");
    let cableTechJoinedData = ref([]);
    const searchInCableTechJoinData = computed(() => {
      console.log("searchInCableTechJoinData:", searchInCableTechJoinData);
      return cableTechJoinedData.value.filter(cable => {
        return cable.name.toLowerCase().includes(searchKey.value.toLowerCase());
      });
    });

    return {
      cables,
      caisseToList,
      mfcupdate,
      deletemfc,
      searchKey,
      cableTechJoinedData,
      caisses,
      selectype,
      typechoose,
      count,
      cableid,
      cableIdsInMfc,
      cableMfcTechJoinedData,

      cableLayoutData,
      cableTechBase,
      //   mfcget,
      //   cable_get,
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
  /* display: flex; */
  /* flex-wrap: wrap; */
  /* margin: auto; */
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
</style>
