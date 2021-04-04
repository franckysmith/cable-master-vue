<template>
  <div class="main" v-for="cable in cables" :key="cable.cableid">
    <form @subbmit.prevent="update_order()">
      <div class="number" v-if="cable.type == typechoose">
        <div class="name">
          <h4>{{ cable.name }}</h4>
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

        <div><input name="tfc1" v-model="cable.tfc1" /></div>

        <div>
          <input name="tfc2" v-model="cable.tfc2" />
        </div>
        <div><input name="tfc3" v-model="cable.tfc3" /></div>

        <div><input name="tfc4" v-model="cable.tfc4" /></div>

        <div><input name="tfc5" v-model="cable.tfc5" /></div>
      </div>
    </form>
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
.countfc {
  margin-right: 10px;
}
.countfc p {
  /* line-height: 10px; */
  padding-top: 5px;
  border: 1px solid black;
  background: rgb(224, 222, 222);
  width: 23px;
  height: 20px;
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
  width: 325px;
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

.name h4 {
  /* margin: 10px 0px; */
  font-weight: 500;
  text-align: left;
  width: 100px;
  padding: 1px 1px 1px 3px;
  /* margin-left: 5px; */
  background-color: #c1c7c33a;
  border-left: 5px solid #4dcc59;
}
.number {
  display: flex;
  border-width: 0px 0px 1px 0px;
  align-content: flex-start;
  align-items: center;
}

.number input {
  width: 15px;
  margin: 5px;
}
.post {
  display: flex;
  flex-direction: column;
  align-items: center;
}
form {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
