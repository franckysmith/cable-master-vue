<template>
  <Formaffaire @lessonaffaire="affaireToList" />
  <div class="about">
    <h1>CableTech page</h1>

    <p></p>
    <div>
      <div>
        <div class="poste">
          <input class="button" value="HP" />
          <input class="button" value="Module" />
          <input class="button" value="Elec" />
          <input class="button" value="Spécial" />
          <input class="button" value="Micros" />
        </div>
        <div><input class="button" type="submit" value="Save" /></div>
      </div>

      <div class="head">
        <div style="padding-left:22px">requis</div>
        <div>spare</div>
        <div style="padding-left:28px">dispo</div>
      </div>
      <div class="content-number" v-for="cable in cables" :key="cable.cableid">
        <div class="number">
          <input type="checkbox" />
          <div class="name">
            <h3>{{ cable.name }}{{ cable.cableid }}</h3>
          </div>

          <div><input name="reserved" /></div>
          <div><button :href="cable.link">link</button></div>
        </div>
      </div>
    </div>
  </div>
  <div><button>getorder</button></div>
  <div v-for="order in orders" :key="order.orderid">
    {{ order.count }} {{ orer.cableid }}
  </div>
</template>
<script>
import Formaffaire from "@/components/Formaffaire.vue";
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";

var api = new Api(url);
// @ is an alias to /src
import { ref } from "vue";

// import cablageServices from "@/services/cablage.js";

export default {
  name: "Cabletech",
  components: { Formaffaire },

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

    // affairid from component Formaffaire
    let dataAffaire = ref("");
    let affairid = ref("");
    let orders = ref([]);
    // function affaireToList(data) {
    //   dataAffaire.value = data;

    // order get with affairid
    const affaireToList = function(data) {
      dataAffaire.value = data;
      let searchby = { affairid: dataAffaire.value };

      console.log("searchby | affairid", searchby);

      api
        .call("order_get", searchby)
        .then(response => {
          console.log("order_get:", response);
          orders.value = response;
        })
        .catch(function(response) {
          console.log("order_get:", response);
        });
      console.log("affairid", data);
    };

    return {
      cables,
      affaireToList,
      affairid,
      orders,
      dataAffaire
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
.button {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #4dcc59;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.dates {
  margin: 10px;
  display: flex;
  justify-content: space-around;
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
.poste {
  margin: 10px 0px 20px 0px;
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

.name h3 {
  font-size: 15px;
  font-weight: 500;
  text-align: left;
  width: 160px;
  /* margin-left: 5px; */
  background-color: #c1c7c33a;
}
</style>
