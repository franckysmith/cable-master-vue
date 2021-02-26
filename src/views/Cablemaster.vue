<template>
  <div class="home"></div>
  <div class="head">
    <div>secu</div>
    <div style="padding-left:28px">total</div>
    <div style="padding-left:22px">réservé</div>
  </div>
  <div class="content-number" v-for="cable in cables" :key="cable.cableid">
    <div class="number">
      <div class="name"><input v-model="cable.name" /></div>
      <div><input v-model="cable.reserved" name="secu" /></div>
      <div><input v-model="cable.total" name="total" /></div>
      <div><input v-model="cable.reserved" name="reserved" /></div>
      <div><button id="id" :href="cable.link">link</button></div>
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
        <input style="color:#c9c9c9" v-model="cable.link" placeholder="link" />

        <select v-model="cable.type">
          <option
            v-for="choix in typeChoose"
            :key="choix.id"
            :value="choix.value"
            :placeholder="choix.value"
            >{{ choix.name }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";

var api = new Api(url);
// @ is an alias to /src
import { ref } from "vue";

import cablageServices from "@/services/cablage.js";

export default {
  name: "Cablemaster",

  setup() {
    let cables = ref([]);
    const typeChoose = ref([
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
      }
    ]);
    api
      .call("cable_get")
      .then(response => {
        cables.value = response;
        console.log("cable_get:", response);
      })
      .catch(response => {
        console.log("err_cable_get:", response);
      });

    function add_cable(data) {
      console.log("cablemaster | cableadd()", data);
      cablageServices.cableadd(data);
    }

    function delete_cable(data) {
      console.log("cablemaster | cabledelete()", data);
      cablageServices.cabledelete([data]);
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
      typeChoose
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
.number {
  display: flex;
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
.content-number {
  border-width: 0px 0px 1px 0px;
  border-style: solid;
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
button {
  margin: 3px;
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
