<template>
  <AddAffair v-if="affairIsOpen" @lesson-fermer-newAff="toAffairOpen" />
  <Formaffaire
    @lessonaffaire="affaireIdToList"
    @lesson-open-newaff="toAffairOpen"
    v-if="!affairIsOpen"
  />

  <div class="content-liste">
    ----------------------
    <h3>Listes cables etc ...</h3>
    <div>
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
          <button @click="selectype('electrical')">All</button>
          <input
            type="text"
            v-model="searchKey"
            placeholder="Rechercher un élément"
          />
        </div>
      </div>
      <form @submit.prevent="update_order(orders)">
        <button class="button2" type="submit">
          Update
        </button>

        <button class="button2" @click="filtreMaliste">ma liste</button>
        <button
          class="button2"
          @click="cableTechLayout('cableTechBase')"
          type="button"
        >
          Nb total
        </button>

        <button
          class="button2"
          @click="cableTechLayout('flightcase')"
          type="button"
        >
          flightcase
        </button>

        <div v-if="cableLayoutData == 'cableTechBase'">
          <div
            class="head"
            v-for="affairo in affaireSelected"
            :key="affairo.affairid"
          >
            <div><p>Sécu</p></div>
            <div style="padding-left:12px">
              <input type="text" v-model="affairo.lz1" placeholder="Zone1" />
            </div>
            <div style="padding-left:5px">
              <input type="text" placeholder="Zone2" />
            </div>
            <div style="padding-left:3px">
              <input type="text" placeholder="Zone3" />
            </div>
            <div style="padding-left:4px">
              <input type="text" placeholder="Zone4" />
            </div>
            <div style="padding-left:4px">
              <input type="text" placeholder="Zone5" />
            </div>
            {{ affairo }}
          </div>
          <div class="content-number">
            <div
              v-for="cable in searchInCableTechJoinData"
              :key="cable.cableid"
            >
              <!-- ------------ v-if="cable.count > 0" -->
              <!----------- v-if="filterCable" ------->
              <div v-if="cable.type == typechoose">
                <div>
                  <div class="number">
                    <div>
                      <input type="checkbox" :checked="cable.isChecked" />
                    </div>
                    <div class="name">
                      <h4>{{ cable.name }}</h4>
                    </div>

                    <div>
                      <input name="spare_count" v-model="cable.spare_count" />
                    </div>

                    <div>
                      <input name="" v-model="cable.z1" />
                    </div>
                    <div>
                      <input name="" v-model="cable.z2" />
                    </div>
                    <div>
                      <input name="" v-model="cable.z3" />
                    </div>
                    <div>
                      <input name="" v-model="cable.z4" />
                    </div>
                    <div>
                      <input name="" v-model="cable.z5" />
                    </div>
                    <div>
                      <input name="" v-model="cable.count" />
                    </div>
                    <div>
                      {{
                        parseInt(cable.z1) +
                          parseInt(cable.z2) +
                          parseInt(cable.z3) +
                          parseInt(cable.z4) +
                          parseInt(cable.z5)
                      }}
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
          </div>
        </div>
      </form>
    </div>
  </div>

  <FlyCaseManagment
    v-if="cableLayoutData == 'flightcase'"
    :cables="searchInCableTechJoinData"
    :typechoose="typechoose"
  />
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

import Formaffaire from "@/components/Formaffaire.vue";
import FlyCaseManagment from "@/components/FlyCaseManagment.vue";

import AddAffair from "@/components/AddAffair.vue";

import { ref, computed } from "vue";

export default {
  name: "Cabletech",
  components: { Formaffaire, FlyCaseManagment, AddAffair },

  setup() {
    // cable list name total link info
    let cables = ref([]);
    api
      .call("cable_get")
      .then(response => {
        console.log("cable_get:", response);
        cables.value = response;
      })
      .catch(response => {
        console.log("err_cable_get:", response);
      });
    let affaire = ref([]);
    let affairid = ref("");
    let affairIsOpen = ref("");
    let affaireSelected = ref([]);
    let orders = ref([]);
    let order = ref({});
    let reserved = ref("");
    let typechoose = ref("speaker");
    let cable = ref("");
    // let cables =ref([]);
    let count = ref("");
    let cableid = ref("");
    let cableLayoutData = ref("cableTechBase");
    let cableIdsInOrders = ref([]);
    let cableTechJoinedData = ref([]);
    let cableTechBase = ref("");
    let filterCable = ref(false);
    let newAffairOpen = ref(Boolean);
    let searchKey = ref("");
    let affairefrom = ref([]);
    let z1 = ref("");
    let z2 = ref("");
    let z3 = ref("");
    // let totalCount = ref("");

    //from emit to v-if
    function toAffairOpen(data) {
      affairIsOpen.value = data;
    }

    // function faffaireSelected(data) {
    //   affaireSelected.value = data;
    //   console.log("affaireSelected", affaireSelected);
    // }

    // order get with affairid
    function affaireIdToList(data) {
      cableIdsInOrders.value = [];
      cableTechJoinedData.value = [];
      let searchbyaff = { affairid: data.affairid };
      let affaireSelected = data;
      console.log("affaireSelected", affaireSelected);
      console.log("affairToList data", data);

      api
        .call("order_get", searchbyaff)
        .then(response => {
          console.log("order_get:", response);
          orders.value = response;

          // create a view-model joining order items and cables

          aggregateData(response, cables.value);
        })
        .catch(function(response) {
          console.log("order_get:", response);
        });
    }

    // aggregateData table 'cables' et 'orders'
    function aggregateData(orders, cables) {
      orders.forEach(o => {
        cableIdsInOrders.value.push(o.cableid);
      });

      cables.forEach(cable => {
        let line = {
          isChecked: false,
          name: cable.name,
          count: "",
          spare_count: "",
          total: cable.total,
          link: cable.link,
          info: cable.info,
          type: cable.type,
          orderid: "",
          tfc1: "",
          tfc2: "",
          tfc3: "",
          tfc4: "",
          tfc5: "",
          z1: "",
          z2: "",
          z3: "",
          z4: "",
          z5: ""
        };

        if (cableIdsInOrders.value.includes(cable.cableid)) {
          const orderItem = orders.find(o => o.cableid === cable.cableid);

          line = {
            isChecked: true,
            name: cable.name,
            count: orderItem.count,
            spare_count: orderItem.spare_count,
            total: cable.total,
            link: cable.link,
            info: cable.info,
            type: cable.type,
            tfc1: orderItem.tfc1,
            tfc2: orderItem.tfc2,
            tfc3: orderItem.tfc3,
            tfc4: orderItem.tfc4,
            tfc5: orderItem.tfc5,
            z1: orderItem.z1,
            z2: orderItem.z2,
            z3: orderItem.z3,
            z4: orderItem.z4,
            z5: orderItem.z5,
            orderid: orderItem.orderid
          };
        }

        cableTechJoinedData.value = [...cableTechJoinedData.value, line];
      });

      console.log("cableTechJoinedData.value", cableTechJoinedData.value);
    }
    // from emit to lz14 ..lz5  lfc1 ..lfc5 labels
    function affairfromformaffair(data) {
      affairefrom.value = data;
      console.log("affair to label", affairefrom.value);
    }

    // ---- recherche dans liste cable par searchKey
    const searchInCableTechJoinData = computed(() => {
      console.log("searchInCableTechJoinData:", searchInCableTechJoinData);
      return cableTechJoinedData.value.filter(cable => {
        return cable.name.toLowerCase().includes(searchKey.value.toLowerCase());
      });
    });

    // calculer count
    const calculCount = computed(() => {
      console.log("calculCount", searchInCableTechJoinData);
      return parseInt(z1.value) + parseInt(z2.value);
    });

    // --- filtrer liste
    function filtreMaliste() {
      console.log("cables", cables.value);
    }

    // choose display cable_type (buttons)
    function selectype(data) {
      console.log("typechoose", data);
      typechoose.value = data;
    }

    // save/update order
    function update_order(param) {
      console.log("cabletech | orderupdate", param);
      cablageServices.orderupdate([param]);
    }

    //cableTechLayout button organisation fightcase et
    function cableTechLayout(data) {
      console.log("data cableTechLayout", data);
      cableLayoutData.value = data;
    }

    // open info
    // function toggleInfo() {
    //   let infoToggle = infoToggle;
    //   console.log("toggleInfo", toggleInfo);
    // }

    return {
      cables,
      cable,
      affaire,
      affaireIdToList,
      affairIsOpen,
      affairid,
      affairefrom,
      affairfromformaffair,
      affaireSelected,

      orders,
      update_order,
      reserved,
      selectype,
      typechoose,
      filterCable,
      count,
      cableid,
      cableIdsInOrders,
      cableTechJoinedData,
      cableTechLayout,
      cableLayoutData,
      cableTechBase,
      calculCount,
      filtreMaliste,
      newAffairOpen,
      order,
      searchInCableTechJoinData,
      searchKey,
      toAffairOpen,
      z1,
      z2,
      z3
    };
  }
};
</script>
<style scoped>
button {
  margin: 3px;
  cursor: pointer;
}
button.link {
  margin: 0px 0px 3px 0px;
}
.button2 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #ebe7df;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.button2.active {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #eb910a;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

.content-liste {
  margin: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
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
.head {
  display: flex;
  /* margin: auto; */
  width: 400px;
  height: 20px;
  text-align: left;
  padding-left: 135px;
}
.head input {
  width: 30px;
  border: 1px rgb(211, 210, 210);
  font-size: 10px;
  font-weight: 400;
}
.head p {
  line-height: 1px;
  font-size: 12px;
}

input {
  padding: 5px;
}
.info-content {
  height: 14px;
  margin: 0px 0px 10px 0px;
  line-height: 0;
}
.info {
  font-size: 12px;
  width: 360px;
  height: 20px;
  display: flex;
  justify-content: space-between;
  text-align: left;
  /* padding: 0px; */
  margin: 0px 0px 5px 30px;
  font-style: italic;
  border-bottom: 1px solid;
}

.link {
  height: 18px;
  background: transparent;
  border: 1px solid grey;
  color: grey;
  /* line-height: 10; */
}
.link2 {
  height: 25px;
  background: transparent;
  border: 1px solid grey;
  color: grey;
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
  width: 100px;
}
.name h4 {
  margin: 10px 0px;
  font-weight: 500;
  text-align: left;
  width: 110px;
  padding: 1px 1px 1px 3px;
  /* margin-left: 5px; */
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
  font-weight: 00;
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
