<template>
  hello
  <div v-for="cable in cables" :key="cable.cableid" class="content">
    <div>
      <h4>
        {{ cable.name }}
      </h4>
    </div>
    <div>
      <h4>{{ cable.count }}</h4>
    </div>
  </div>
</template>

<script>
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";
var api = new Api(url);

import { ref } from "vue";

export default {
  name: "about",

  setup() {
    // call cable_get
    let cables = ref([]);
    let cableMfcJoinedData = ref([]);
    let cableIdsInMfc = ref([]);
    let cablemfc = ref([]);
    let caisseSelected = ref([]);

    api
      .call("cable_get")
      .then(response => {
        console.log("cable_get:", response);
        cables.value = response;
      })
      .catch(response => {
        console.log("err_cable_get", response);
      });

    // call cablemfc_get and aggregateData with cables mfcid=3 is valid
    function caisseToList(data) {
      // let cablemfc = ref([]);
      // let searchcaisse = { mfcid: 3 };
      caisseSelected.value = data;

      api
        .call("cablemfc_get", { mfcid: data.mfcid })
        .then(response => {
          console.log("cablemfc_get:", response);
          cablemfc.value = response;

          // create a view-model joining cablemfc items and cables

          aggregateData(response, cables.value);
        })
        .catch(function(response) {
          console.log("cablemfc_get:", response);
        });
      //  console.log("affairid | Cabletech", data);
    }
    // aggregateData table 'cables' et 'cablemfc'

    function aggregateData(cablemfc, cables) {
      cablemfc.forEach(o => {
        cableIdsInMfc.value.push(o.cableid);
      });

      cables.forEach(cable => {
        let line = {
          isChecked: false,
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
            isChecked: true,
            name: cable.name,
            count: cablemfcItem.count,

            total: cable.total,
            link: cable.link,
            info: cable.info,
            type: cable.type
          };
        }

        cableMfcJoinedData.value = [...cableMfcJoinedData.value, line];
      });

      console.log("cableMfcJoinedData.value", cableMfcJoinedData.value);
    }
    return {
      cables,
      cableMfcJoinedData,
      cablemfc,
      caisseToList
    };
  }
};
</script>

<style scoped>
.content {
  display: flex;
  justify-content: space-between;
  width: 20%;
  line-height: 3px;
}
</style>
