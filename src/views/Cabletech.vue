<template>
  <Formaffaire @lessonaffaire="affaireToList" />
  <div class="content-liste">
    <h1>CableTech page</h1>

    <button class="button2" @click.prevent="resume = !true" v-if="resume">
      fermer la liste
    </button>
    <div v-if="!resume" class="main">
      <div>
        <div class="post">
          <button @click="selectype('speaker')">HP</button>
          <button @click="selectype('electrical')">Elec</button>
          <button @click="selectype('module')">Modules</button>
          <button @click="selectype('special')">Special</button>
          <button @click="selectype('multi')">multis</button>
          <button @click="selectype('microphone')">Micros</button>
          <button @click="selectype('c_type')">caisses-type</button>
        </div>
      </div>

      <form @submit.prevent="update_order()">
        <button @click="submit" class="button2" type="submit">Save</button>
        <button class="button2" @click.prevent="resume = true">liste</button>
        <div class="head">
          <div>count</div>
          <div style="padding-left:10px">spare</div>
          <div style="padding-left:13px">total</div>
        </div>
        <div class="content-all">
          <div
            class="content-number"
            v-for="cable in cables"
            :key="cable.cableid"
          >
            <div class="number" v-if="cable.type == typechoose">
              <input type="checkbox" />
              <div class="name">
                <h3>{{ cable.name }}</h3>
              </div>

              <div>
                <input name="count" v-model="cable.count" />
              </div>
              <div>
                <input name="spare_count" v-model="cable.spare_count" />
              </div>
              <div>
                <input name="total" v-model="cable.total" />
              </div>

              <div><button :href="cable.link">link</button></div>
              <div><button :href="cable.info">info</button></div>

              <div>
                <p>{{ cable.info }}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
  <div v-if="resume">
    <div class="content-resume" v-for="cable in cables" :key="cable.cableid">
      <table>
        <tr>
          <th>
            {{ cable.name }}
          </th>
          <th>
            {{ cable.total }}
          </th>
        </tr>
      </table>
    </div>
  </div>
  <div><button>getorder</button></div>
  <div v-for="order in orders" :key="order.orderid">
    {{ order.count }} {{ order.cableid }}
  </div>
</template>
<script>
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";
var api = new Api(url);
import cablageServices from "@/services/cablage.js";

import Formaffaire from "@/components/Formaffaire.vue";

import { ref, computed } from "vue";

export default {
  name: "Cabletech",
  components: { Formaffaire },

  setup() {
    // cable list name total link info
    let cables = ref([]);
    api
      .call("cable_get")
      .then((response) => {
        console.log("cable_get:", response);
        cables.value = response;
      })
      .catch((response) => {
        console.log("err_cable_get:", response);
      });

    // affairid from component Formaffaire

    let affairid = ref("");
    let orders = ref([]);
    let reserved = ref("");
    let typechoose = ref("microphone");
    let resume = ref(false);
    let cable = ref("");

    // let order = ref([]);
    // let search = ref("");
    // function affaireToList(data) {
    //   dataAffaire.value = data;

    // order get with affairid
    function affaireToList(data) {
      let searchbyaff = { affairid: data };

      api
        .call("order_get", searchbyaff)
        .then((response) => {
          console.log("order_get:", response);
          orders.value = response;
        })

        .catch(function (response) {
          console.log("order_get:", response);
        });

      console.log("affairid | Cabletech", data);
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
    // soustraction total et reserved
    const cableTotalTech = computed(() => {
      console.log("cableTotalTech", cable.value.total);
      return cable.value.total + cable.value.reserved;
    });

    return {
      cables,
      affaireToList,
      affairid,
      orders,
      update_order,
      reserved,
      selectype,
      typechoose,
      resume,
      cableTotalTech,
    };
  },
};
</script>
<style scoped>
input {
  padding: 5px;
}
.entete {
  display: flex;
  justify-content: space-around;
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
.button2 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #e9ac07;
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
.dates {
  margin: 10px;
  display: flex;
  justify-content: space-around;
}
.content-number {
  width: 400px;
  display: flex;
  /* flex-wrap: wrap; */
  /* margin: auto; */
}
.cont_2 {
  display: flex;
}
.cont_2 input {
  margin: 5px;
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

.post {
  margin: 10px 0px 20px 0px;
  width: 400px;
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
.head {
  display: flex;
  /* margin: auto; */
  width: 400px;
  text-align: left;
  padding-left: 155px;
}
.number {
  display: flex;
  border-width: 0px 0px 1px 0px;
  border-style: solid;
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
.list_container {
  width: 400px;
}
button {
  margin: 3px;
}

.name h3 {
  font-size: 15px;
  font-weight: 500;
  text-align: left;
  width: 130px;
  /* margin-left: 5px; */
  background-color: #c1c7c33a;
}

.main {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
