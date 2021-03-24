<template>
  <AddAffair v-if="affairIsOpen" @lesson-fermer-newAff="toAffairOpen" />
  <Formaffaire
    @lessonaffaire="affaireToList"
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
        <button @click="selectype('multi')">autres</button>
        <button @click="selectype('microphone')">Micros</button>
        <button @click="selectype('c_type')">caisses-type</button>
        <button @click="selectype('c_type')">accessoires</button>
        <button @click="selectype('special')">
          numériques
        </button>

        <div>
          <input
            type="text"
            v-model="searchKey"
            placeholder="Rechercher un élément"
          />
        </div>
      </div>
      <form @subbmit.prevent="update_order(cable)">
        <button class="button2" id="save-liste" type="submit">
          Enregistrer
        </button>

        <button
          class="button2"
          @click="filtreMaliste"
          @dblclick="initFiltreMaliste"
          type="button"
        >
          ma liste
        </button>
        <button
          class="button2"
          @click="cableTechLayout('cableTechBase')"
          type="button"
        >
          total/spare
        </button>

        <button
          class="button2"
          @click="cableTechLayout('flightcase')"
          type="button"
        >
          flightcase
        </button>

        <div v-if="cableLayoutData == 'cableTechBase'">
          <div class="head">
            <div>Sécu</div>
            <div style="padding-left:20px">z1</div>
            <div style="padding-left:25px">z2</div>
            <div style="padding-left:25px">z3</div>
            <div style="padding-left:28px">z4</div>
            <div style="padding-left:25px">z5</div>
          </div>
          <div class="content-number">
            <div v-for="cable in search" :key="cable.cableid">
              <!-- ------------ v-if="cable.count > 0" -->
              <!----------- v-if="filterCable" ------->
              <div>
                <div v-if="cable.type == typechoose">
                  <div class="number">
                    <div>
                      <input type="checkbox" :checked="cable.isChecked" />
                    </div>
                    <div class="name">
                      <h3>{{ cable.name }}</h3>
                    </div>

                    <div>
                      <input name="spare_count" v-model="cable.count" />
                    </div>

                    <div>
                      <input name="" />
                    </div>
                    <div>
                      <input name="" />
                    </div>
                    <div>
                      <input name="" />
                    </div>
                    <div>
                      <input name="" />
                    </div>
                    <div>
                      <input name="" />
                    </div>

                    <div></div>
                  </div>
                  <div>
                    <div class="info">
                      <p>{{ cable.info }}</p>
                      <button type="button" class="button-link">
                        <a :href="cable.link">link</a>
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
  <!-- <CableTechOrg
    v-if="cableLayoutData == 'orga'"
    :cableTechJoinedData="cables"
    :typechoose="typechoose"
  /> -->
  <FlyCaseManagment
    v-if="cableLayoutData == 'flightcase'"
    :cables="cableTechJoinedData"
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

    let affairid = ref("");
    let affairIsOpen = ref("");
    let orders = ref([]);
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
    let filterCable = ref("");
    let newAffairOpen = ref(Boolean);
    let searchKey = ref("");
    let zero = ref("-1");

    function filtreMaliste() {
      filterCable = cable.value.count > 0;
    }
    function initFiltreMaliste() {}
    function toAffairOpen(data) {
      affairIsOpen.value = data;
    }

    // order get with affairid
    function affaireToList(data) {
      cableIdsInOrders.value = [];
      cableTechJoinedData.value = [];
      let searchbyaff = { affairid: data };

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

      console.log("affairid | Cabletech", data);
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
          spare_count: 0,
          total: cable.total,
          link: cable.link,
          info: cable.info,
          type: cable.type,
          tfc1: "",
          tfc2: "",
          tfc3: "",
          tfc4: "",
          tfc5: ""
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
            tfc5: orderItem.tfc5
          };
        }

        cableTechJoinedData.value = [...cableTechJoinedData.value, line];
      });

      console.log("cableTechJoinedData.value", cableTechJoinedData.value);
    }

    // ---- recherche dans liste cable par searchKey
    const search = computed(() => {
      return cableTechJoinedData.value.filter(cable => {
        return cable.name.includes(searchKey.value);
      });
    });

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

    // soustraction total et reserved
    const cableTotalTech = computed(() => {
      console.log("cableTotalTech", cable.value.total);
      return cable.value.total + cable.value.reserved;
    });

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
      affaireToList,
      affairIsOpen,
      affairid,
      orders,
      update_order,
      reserved,
      selectype,
      typechoose,
      filterCable,
      filtreMaliste,
      count,
      cableid,
      cableIdsInOrders,
      cableTechJoinedData,
      cableTotalTech,
      cableTechLayout,
      cableLayoutData,
      cableTechBase,
      initFiltreMaliste,
      newAffairOpen,
      search,
      searchKey,
      toAffairOpen,
      zero
    };
  }
};
</script>
<style scoped>
button {
  margin: 3px;
  cursor: pointer;
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
.button-link {
  height: 25px;
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
.head {
  display: flex;
  /* margin: auto; */
  width: 400px;

  text-align: left;
  padding-left: 135px;
}
input {
  padding: 5px;
}
.info {
  font-size: 12px;
  width: 360px;
  height: 30px;
  display: flex;
  justify-content: space-between;
  text-align: left;
  /* padding: 0px; */
  margin: 0px 0px 5px 30px;
  font-style: italic;
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
.name h3 {
  font-size: 15px;
  font-weight: 500;
  text-align: left;
  width: 130px;
  padding: 1px 1px 1px 3px;
  /* margin-left: 5px; */
  background-color: #c1c7c33a;
  border-left: 5px solid #4dcc59;
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
