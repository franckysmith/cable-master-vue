<template>
  <div class="content-liste">
    <div v-if="!flightcase">
      <form @subbmit.prevent="update_order()">
        <div class="head">
          <div>count</div>
          <div style="padding-left:20px">FC1</div>
          <div style="padding-left:15px">FC2</div>
          <div style="padding-left:20px">FC3</div>
          <div style="padding-left:22px">FC4</div>
          <div style="padding-left:23px">FC5</div>
        </div>
        <div class="content-all">
          <div
            class="content-number"
            v-for="cable in cables"
            :key="cable.cableid"
          >
            <div class="number" v-if="cable.type == typechoose">
              <div>
                <input type="checkbox" :checked="cable.tfc_done" />
              </div>
              <div class="name">
                <h3>{{ cable.name }}</h3>
              </div>

              <div class="countfc">
                <p>
                  {{
                    cable.count -
                      cable.tfc1 -
                      cable.tfc2 -
                      cable.tfc3 -
                      cable.tfc4 -
                      cable.tfc5
                  }}
                </p>
              </div>

              <input name="tfc1" v-model="cable.tfc1" />

              <input name="tfc2" v-model="cable.tfc2" />

              <input name="tfc3" v-model="cable.tfc3" />

              <input name="tfc4" v-model="cable.tfc4" />

              <input name="tfc5" v-model="cable.tfc5" />
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
<script>
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";
var api = new Api(url);
import cablageServices from "@/services/cablage.js";

import { ref } from "vue";

export default {
  name: "FlyCaseManagment",
  props: {
    typechoose: {
      type: String
    },
    cables: {
      type: Array
    }
  },

  setup() {
    // let fcCount = computed(() => {
    //   console.log("cable.value.count", cable.value.count);
    //   return cable.value.count - cable.value.tfc1;
    // });

    let affairid = ref("");
    let orders = ref([]);
    let reserved = ref("");
    let typechoose = ref("microphone");
    let resume = ref(false);
    let count = ref("");
    let cableid = ref("");
    let cableIdsInOrders = ref([]);
    let flightcase = ref("");
    let cable = ref([]);

    // order get with affairid
    function affaireToList(data) {
      let searchbyaff = { affairid: data };

      api
        .call("order_get", searchbyaff)
        .then(response => {
          console.log("order_get:", response);
          orders.value = response;
          orders.value.forEach(o => {
            cableIdsInOrders.value.push(o.cableid);
          });
        })

        .catch(function(response) {
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

    // addition total et reserved
    // const cableTotalTech = computed(() => {
    //   console.log("cableTotalTech", cable.value.total);
    //   return cable.value.total + cable.value.reserved;
    // });

    return {
      affaireToList,
      affairid,
      orders,
      update_order,
      reserved,
      selectype,
      resume,
      count,
      cableid,
      cableIdsInOrders,
      flightcase,

      cable
    };
  }
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
.countfc {
  margin-right: 10px;
}
.countfc p {
  /* line-height: 10px; */
  padding-top: 5px;
  border: 1px solid;
  background: rgb(231, 225, 225);
  width: 23px;
  height: 20px;
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
  font-size: 12px;
  width: 400px;
  text-align: left;
  padding-left: 135px;
}
.number {
  display: flex;
  border-width: 0px 0px 1px 0px;
  border-style: solid;
  height: 40px;
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
  width: 110px;

  /* margin-left: 5px; */
  background-color: #c1c7c33a;
}
</style>
