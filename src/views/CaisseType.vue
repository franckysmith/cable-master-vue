<template>
  <div><button>New</button></div>
  <div v-for="caissetype in mfc" :key="caissetype.mfcid">
    <div>
      <form>
        <div>
          <input type="text" v-model="caissetype.name" />
        </div>
        <div>
          <input type="textarea" v-model="caissetype.info" col="10" row="10" />
        </div>

        <button>Delete</button>

        <button>Update</button>
      </form>
    </div>
  </div>

  <div class="content-liste">
    ----------------------
    <h3>Listes cables etc ...</h3>
    <div>
      <div class="post">
        <button @click="selectype('speaker')">HP</button>
        <button @click="selectype('electrical')">Elec</button>
        <button @click="selectype('module')">Modules</button>
        <button @click="selectype('special')">Spéciaux</button>
        <button @click="selectype('multi')">autres</button>
        <button @click="selectype('microphone')">Micros</button>
        <button @click="selectype('c_type')">caisses-type</button>
        <button @click="selectype('c_type')">accessoires</button>
        <button @click="selectype('c_type')">numériques</button>
      </div>

      <form @subbmit.prevent="update_order(cable)">
        <button class="button2" id="save-liste" type="submit">
          Enregistrer
        </button>

        <div>
          <div class="head">
            <div>count</div>

            <div style="padding-left:13px">total</div>
          </div>
          <div class="content-number">
            <div v-for="cable in cableMfcTechJoinedData" :key="cable.cableid">
              <div v-if="cable.type == typechoose">
                <div class="number">
                  <div class="name">
                    <h3>{{ cable.name }}</h3>
                  </div>

                  <div>
                    <input name="count" v-model="cable.total" />
                  </div>

                  <div>
                    <input name="total" v-model="cable.total" />
                  </div>

                  <div>
                    <button type="button">
                      <a :href="cable.link">link</a>
                    </button>
                  </div>
                  <div>
                    <button type="button">
                      info
                    </button>
                  </div>
                </div>
                <div>
                  <div class="info">
                    {{ cable.info }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
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

import { ref } from "vue";

export default {
  name: "CaisseType",

  setup() {
    // ----------- get caisses -------//

    api
      .call("mfc_get")
      .then(response => {
        mfc.value = response;
      })
      .catch(response => {
        console.log("mfc_get:", response);
      });

    // cable list name total link info etc ...
    let cables = ref([]);
    let caisses = ref([]);
    // function cable_get() {
    //   console.log("caissetype | cable_get");
    //   cablageServices.cableread();
    // }
    api
      .call("cable_get")
      .then(response => {
        console.log("cable_get:", response);
        cables.value = response;
      })
      .catch(response => {
        console.log("err_cable_get:", response);
      });

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

    // order get with affairid
    function caisseToList(data) {
      //   cableIdsInOrders.value = [];
      //   cableTechJoinedData.value = [];

      let searchbycaisse = { mfcid: 3 };
      api
        .call("cablemfc_get", searchbycaisse)
        .then(response => {
          console.log("cablemfc_get:", response);
          cablemfc.value = response;

          // create a view-model joining order items and cables

          aggregateData(response, cables.value);
        })
        .catch(function(response) {
          console.log("cablemfc_get:", response);
        });

      console.log("cablemfcid | CaisseType", data);
    }

    // aggregateData table 'cables' et 'cablemfc'
    function aggregateData(cablemfc, cables) {
      cablemfc.forEach(o => {
        cableIdsInMfc.value.push(o.cableid);
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
          const cablemfcItem = cablemfc.value.find(
            o => o.cableid === cable.cableid
          );

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

    // save/update order
    function cablemfc_order(param) {
      console.log("cabletech | orderupdate", param);
      cablageServices.cablemfcupdate([param]);
    }

    return {
      cables,
      caisseToList,

      cablemfc_order,
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
.content-liste {
  margin: auto;
  text-align: center;
}
.content-resume {
  display: flex;
  text-align: left;
  width: 400px;
  justify-content: space-between;
}

.content-number {
  width: 400px;
  height: 45px;
  /* display: flex; */
  /* flex-wrap: wrap; */
  /* margin: auto; */
}
.cont_2 {
  display: flex;
}
.cont_2 input {
  margin: 5px;
}
.dates {
  margin: 10px;
  display: flex;
  justify-content: space-around;
}
.entete {
  display: flex;
  justify-content: space-around;
}
input {
  padding: 5px;
}
.info {
  font-size: 12px;
  width: 400px;

  text-align: left;
  /* padding: 0px; */
  margin: 0px 0px 5px 30px;
}
.head {
  display: flex;
  /* margin: auto; */
  width: 400px;

  text-align: left;
  padding-left: 155px;
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
.name h3 {
  font-size: 15px;
  font-weight: 500;
  text-align: left;
  width: 130px;
  /* margin-left: 5px; */
  background-color: #c1c7c33a;
}
.number {
  display: flex;
  border-width: 0px 0px 1px 0px;
  /* border-style: solid; */
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
.number2 {
  display: flex;
  /* flex: auto 2; */
  margin: 0px 15px 20px;
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

.tech {
  width: 200px;
}
table {
  margin: 10px 0px 10px 0px;
  border: solid 1px;
  border-collapse: separate;
  border-spacing: 0px;
  text-align: left;
  -webkit-box-shadow: 0px 0px 30px -2px rgba(0, 0, 0, 0.75);
  -moz-box-shadow: 0px 0px 30px -2px rgba(0, 0, 0, 0.75);
  box-shadow: 0px 0px 30px -2px rgba(0, 0, 0, 0.75);
}
th {
  width: 250px;
  padding-left: 5px;
}
.titre_affaire {
  width: 200px;
  height: 32px;
  left: 34px;
  top: 63px;

  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}
</style>
