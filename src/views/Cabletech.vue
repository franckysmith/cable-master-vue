<template>
  <div class="main">
    {{ $store.getters.getCableCount }}
    {{ $store.getters.getCableName }}
    <!-- {{ $store.state.cabletech.cables }} -->
    <!-- {{ $store.state.arrcount }} -->
    <AddAffair
      v-if="affairIsOpen === true"
      @listenopennewaff="toAffairOpen"
      @listenclosenewaff="toAffairOpen"
      @showcreatedaff="openNewAffair"
    />
    <Affaires
      @updateaffair="updateaffair"
      @listenaffaire="affaireIdToList"
      @listenaffairelabel="getAffaireToLabel"
      @listenopennewaff="toAffairOpen"
      v-if="affairIsOpen === false"
      ref="affairesRef"
    />
    <ModalDelete @close="isOpentfc = false" v-if="isOpentfc">
      <template v-slot:main>
        <h1>{{ affaireSelected[countlfc] }}</h1>

        <div v-for="cable in searchInCableTechJoinData" :key="cable.cableid">
          <div v-if="cable[countfc] > 0" class="content-list-tfc">
            <h2>{{ cable[countfc] }}</h2>
            <h3>{{ cable.name }}</h3>
          </div>
        </div>
      </template>
      <template #footer>
        <button>fermer</button>
      </template>
    </ModalDelete>
    <div class="content-liste">
      ----------------------
      <h3>Listes cables etc ...</h3>

      <div class="post">
        <button
          @click="selectype('speaker')"
          :class="typechoose === 'speaker' ? 'selectedtype' : ''"
        >
          HP
        </button>
        <button
          @click="selectype('electrical')"
          :class="typechoose === 'electrical' ? 'selectedtype' : ''"
        >
          Elec
        </button>
        <button
          @click="selectype('module')"
          :class="typechoose === 'module' ? 'selectedtype' : ''"
        >
          Modules
        </button>
        <button
          @click="selectype('special')"
          :class="typechoose === 'special' ? 'selectedtype' : ''"
        >
          Spéciaux
        </button>
        <button
          @click="selectype('other')"
          :class="typechoose === 'other' ? 'selectedtype' : ''"
        >
          autres
        </button>
        <button
          @click="selectype('microphone')"
          :class="typechoose === 'microphone' ? 'selectedtype' : ''"
        >
          Micros
        </button>
        <button
          @click="selectype('c_type')"
          :class="typechoose === 'c_type' ? 'selectedtype' : ''"
        >
          caisses-type
        </button>
        <button
          @click="selectype('accessory')"
          :class="typechoose === 'accessory' ? 'selectedtype' : ''"
        >
          accessoires
        </button>
        <button
          @click="selectype('digital')"
          :class="typechoose === 'digital' ? 'selectedtype' : ''"
        >
          numériques
        </button>
      </div>

      <div class="content-button2">
        <button
          class="buttonv"
          @click="selectype('')"
          :class="typechoose === '' ? 'selectedtype' : 'button'"
        >
          All
        </button>
        <input
          class="search"
          type="text"
          v-model="searchKey"
          placeholder="Rechercher "
        />
        <!-- Rounded switch -->
        <label class="toggle-label" v-if="cableLayoutData == 'flightcase'">
          ma liste
          <label class="switch">
            <input type="checkbox" />
            <span class="sliderder round"></span>
          </label>
        </label>
        <label class="toggle-label" v-if="cableLayoutData == 'cableTechBase'">
          All ..... ma liste
          <label class="switch">
            <input type="checkbox" @click="filtreMaliste" />
            <span class="slider round"></span>
          </label>
        </label>
      </div>

      <form @submit.prevent="set_order(cableTechJoinedData)">
        <div class="total-flightcase">
          <button class="button2" type="submit">Update</button>

          <button
            @click="cableTechLayout('cableTechBase')"
            :class="cableLayoutData === 'cableTechBase' ? 'button3' : 'button'"
          >
            sélectionner
          </button>

          <button
            type="button"
            @click="cableTechLayout('flightcase')"
            :class="cableLayoutData === 'flightcase' ? 'button3' : 'button'"
          >
            flightcase
          </button>
        </div>
        <!-- ---------------  LISTE FLIGHTCASES AND ZONES ----------------------- -->

        <!-- label fc ---------------- -->
        <div v-if="cableLayoutData == 'flightcase'">
          <div class="container-fc">
            <div class="flightcases-button">
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'count', lfc: 'Total' })"
                style="font-size: 7px"
              ></button>
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'tfc1', lfc: 'lfc1' })"
              ></button>
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'tfc2', lfc: 'lfc2' })"
              ></button>
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'tfc3', lfc: 'lfc3' })"
              ></button>
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'tfc4', lfc: 'lfc4' })"
              ></button>
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'tfc5', lfc: 'lfc5' })"
              ></button>
            </div>
            <!-- {{ cableTechJoinedData[6] }} -->

            <div class="head-fc">
              <div>
                <p>Répartir</p>
              </div>
              <div style="padding-left: 5px">
                <input
                  type="text"
                  placeholder="FC1"
                  v-model="affaireSelected.lfc1"
                  default
                />
              </div>
              <div style="padding-left: 3px">
                <input
                  type="text"
                  placeholder="Fc2"
                  v-model="affaireSelected.lfc2"
                />
              </div>
              <div style="padding-left: 10px">
                <input
                  type="text"
                  placeholder="Fc3"
                  v-model="affaireSelected.lfc3"
                />
              </div>
              <div style="padding-left: 2px">
                <input
                  type="text"
                  placeholder="Fc4"
                  v-model="affaireSelected.lfc4"
                />
              </div>
              <div style="padding-left: 5px">
                <input
                  type="text"
                  placeholder="Fc5"
                  v-model="affaireSelected.lfc5"
                />
              </div>
            </div>
          </div>
          <div class="content-number" v-if="cableLayoutData == 'flightcase'">
            <div v-if="typechoose !== ''">
              <FcaseManagement
                :cables="filteredCableByType"
                :cable-type="typechoose"
                :show-my-list="showMyList"
              />
            </div>
            <div v-else>
              <FcaseManagement
                :cables="searchInCableTechJoinData"
                cable-type=""
                :show-my-list="showMyList"
              />
            </div>
          </div>
        </div>

        <!-- -------------------zones ---------------- -->
        <div v-if="cableLayoutData == 'cableTechBase'">
          <div class="container-zone">
            <div
              class="flightcases-button"
              v-if="cableLayoutData == 'cableTechBase'"
            >
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'spare_count', lfc: 'Spare' })"
                style="font-size: 7px"
              ></button>
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'z1', lfc: 'lz1' })"
              ></button>
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'z2', lfc: 'lz2' })"
              ></button>
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'z3', lfc: 'lz3' })"
              ></button>
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'z4', lfc: 'lz4' })"
              ></button>
              <button
                type="button"
                @click="modalOpentfc({ tfc: 'z5', lfc: 'lz5' })"
              ></button>
            </div>
            <div class="head-zone">
              <div class="spare"><p>Spare</p></div>
              <div style="padding-left: 10px">
                <input
                  type="text"
                  placeholder="Zone1"
                  v-model="affaireSelected.lz1"
                />
              </div>
              <div style="padding-left: 5px">
                <input
                  type="text"
                  placeholder="Zone2"
                  v-model="affaireSelected.lz2"
                />
              </div>
              <div style="padding-left: 16px">
                <input
                  type="text"
                  placeholder="Zone3"
                  v-model="affaireSelected.lz3"
                />
              </div>
              <div style="padding-left: 4px">
                <input
                  type="text"
                  placeholder="Zone4"
                  v-model="affaireSelected.lz4"
                />
              </div>
              <div style="padding-left: 8px">
                <input
                  type="text"
                  placeholder="Zone5"
                  v-model="affaireSelected.lz5"
                />
              </div>
            </div>
          </div>
          <!-- <div>arrCount{{ arrCount }}</div> -->

          <!-- sommeOrderCountAff {{ sommeOrderCountAff }} -->

          <div class="content-number">
            <div v-if="typechoose !== ''">
              <CableList
                @listentotalcable="calculcables"
                :cables="filteredCableByType"
                :cable-type="typechoose"
                :show-my-list="showMyList"
                :arr-count="arrCount"
              />
            </div>
            <div v-else>
              <CableList
                @listentotalcable="calculcables"
                :cables="searchInCableTechJoinData"
                cable-type=""
                :show-my-list="showMyList"
                :arr-count="arrCount"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { useStore } from "vuex";
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";
var api = new Api(url);
import cablageServices from "@/services/cablage.js";

import ModalDelete from "@/components/ModalDelete.vue";
import Affaires from "@/components/Affaires.vue";
import FcaseManagement from "@/components/FcaseManagement.vue";
import CableList from "@/components/CableList.vue";
import AddAffair from "@/components/AddAffair.vue";

import { ref, computed } from "vue";

export default {
  name: "Cabletech",
  components: { Affaires, FcaseManagement, AddAffair, CableList, ModalDelete },

  setup() {
    let cables = ref([]);
    let affaire = ref({});
    let affairid = ref("");
    let affairIsOpen = ref(false);
    const affaireSelected = ref([]);
    let orders = ref([]);
    let order = ref([]);
    let reserved = ref("");
    const typechoose = ref("speaker");
    let cable = ref({});
    const count = ref("");
    let countfc = ref([]);
    let countlfc = ref([]);
    let cableid = ref("");
    let cableLayoutData = ref("cableTechBase");
    let cableIdsInOrders = ref([]);
    let cableTechJoinedData = ref([]);
    let cableTechBase = ref("");
    // let calculcable = ref("");
    let filterCable = ref(false);
    const newAffairOpen = ref(Boolean);
    const searchKey = ref("");
    const showMyList = ref(false);
    const affairefrom = ref([]);
    const isOpentfc = ref(false);
    let affairesRef = ref();

    const store = useStore();
    // console.log("store:", store);

    function modalOpentfc(data) {
      countfc.value = data.tfc;
      countlfc.value = data.lfc;

      isOpentfc.value = true;
      console.log("countfc.value | data:", data);
    }

    //from emit to v-if ----------------------
    function toAffairOpen(data) {
      console.log("toAffairOpen(data) | data", data);
      affairIsOpen.value = data;
    }

    function getAffaireToLabel(data) {
      affaireSelected.value = data;
    }

    // cable list  -----------------------
    api
      .call("cable_get")
      .then(response => {
        console.log("cable_get:", response);
        cables.value = response;
        store.dispatch("setCables", response);
      })
      .catch(response => {
        console.log("err_cable_get:", response);
      });

    // order get with affairid
    // let affOrders = ref([]);
    function affaireIdToList(affair) {
      cableIdsInOrders.value = [];
      cableTechJoinedData.value = [];
      // let searchbyaff = { affairid: data.affairid };
      // let affaireSelected = data;
      // console.log("affaireSelected", affaireSelected);

      api
        .call("order_get", { affairid: affair.affairid })
        .then(response => {
          console.log("order_get:", response);
          orders.value = response;
          // create a view-model joining order items and cables
          affOrders.value = response;
          ordersAff(affOrders);
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
          cableid: cable.cableid,
          affairid: affaireSelected.value.affairid,
          tech_id: affaireSelected.value.tech_id,
          done: true,
          name: cable.name,
          color: cable.color,
          count: "0",
          spare_count: "0",
          total: cable.total,
          link: cable.link,
          info: cable.info,
          type: cable.type,
          reserved: cable.reserved
        };
        if (cableIdsInOrders.value.includes(cable.cableid)) {
          const orderItem = orders.find(o => o.cableid === cable.cableid);
          line = {
            cableid: cable.cableid,
            affairid: orderItem.affairid,
            tech_id: orderItem.tech_id,
            done: orderItem.done,
            name: cable.name,
            color: cable.color,
            count: orderItem.count,
            spare_count: orderItem.spare_count,
            total: cable.total,
            link: cable.link,
            info: cable.info,
            reserved: cable.reserved,
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
            tfc_done: orderItem.tfc_done
          };
        }
        countDigestInit(line);
        cableTechJoinedData.value = [...cableTechJoinedData.value, line];
      });
      // console.log("cableTechJoinedData.value", cableTechJoinedData.value);
    }

    // ------------ count AllOrders -----------------
    api
      .call("order_get")
      .then(response => {
        console.log("ALL order_get:", response);
        allOrders.value = response;
        calculOrderCount(allOrders);
        // store.dispatch("setArrCount", response);
      })
      .catch(function(response) {
        console.log("ALL order_get:", response);
      });

    let allOrders = ref([]);
    let arrCount = ref([]);
    let totalCount = ref(0);

    // Calculates arrCount and totalCount.

    function calculOrderCount(allOrders) {
      let total = 0;
      const counts = {}; //name and counts by cableids

      for (let { cableid, count, name } of allOrders.value) {
        count *= 1; // convert to integer
        total += count;

        if (counts[cableid]) count += counts[cableid].count;

        counts[cableid] = { cableid, count, name };
      }
      totalCount.value = total;
      arrCount.value = Object.values(counts);

      // console.log("totalCount:", totalCount.value);
      // console.log("arrCount!:", arrCount.value);
    }
    // --------------- count orders by Aff -------------
    let affOrders = ref([]);
    let arrCountAff = ref([]);
    let totalCountAff = ref(0);

    function ordersAff(affOrders) {
      let total = 0;
      const counts = {}; // name and counts by cableids

      for (let { cableid, count, name } of affOrders.value) {
        count *= 1; // convert to integer
        total += count;

        if (counts[cableid]) count += counts[cableid].count;

        counts[cableid] = { cableid, count, name };
      }
      totalCountAff.value = total;
      arrCountAff.value = Object.values(counts);

      // console.log("totalCountAff:", totalCountAff.value);
      // console.log("arrCountAff:", arrCountAff.value);
    }

    // ------from emit cableList --------------
    const resultCalcul = [];
    function calculcables(data) {
      resultCalcul.value = data;
    }

    function calculateTotal(cable) {
      return (
        parseInt(cable.z1 || 0) +
        parseInt(cable.z2 || 0) +
        parseInt(cable.z3 || 0) +
        parseInt(cable.z4 || 0) +
        parseInt(cable.z5 || 0) +
        parseInt(cable.spare_count || 0)
      );
    }

    //---- count digest ----

    function countDigest(cable) {
      return `${cable.z1},${cable.z2},${cable.z3},${cable.z4},${cable.z5},${cable.spare_count}`;
    }

    function countDigestInit(cable) {
      cable.count_digest = countDigest(cable);
    }

    function countDigestChanged(cable) {
      return cable.count_digest != countDigest(cable);
    }

    // ------------- update all --------
    // Promise.all([
    //   api.call("set_order", orderData),
    //   api.call("updateaffair", affairData)
    // ])
    //   .then(function() {
    //     // no response, so empty
    //   })
    //   .catch(function(error) {
    //     // handle error, if any
    //   });

    //---------------update affair- from emit Afffaires ------------------
    let message = ref("");
    async function updateaffair(param) {
      // console.log("formaffair | affairupdate", param);
      const res = await cablageServices.affaireupdate(param);
      console.log("res", res);
      showMessage(res.msg);
    }
    function showMessage(text) {
      message.value = text;
      setTimeout(() => {
        message.value = "";
      }, 3000);
    }

    // ---------------- save/set_order  -----------------
    function set_order(data) {
      for (const cable of data) cable.count = calculateTotal(cable);

      // update just cables with changed count_digest
      const cables = data.filter(countDigestChanged);
      if (!cables.length) return;

      console.log("cabletech | orderset:::", cables);
      api
        .call("order_set", cables)
        .then(() => {
          data.forEach(countDigestInit);
        })
        .catch(response => {
          console.log("order_set error:");
          console.log(response);
        });
    }

    // ---- recherche dans liste cable par searchKey
    const searchInCableTechJoinData = computed(() => {
      // console.log("searchInCableTechJoinData:", searchInCableTechJoinData);
      return cableTechJoinedData.value.filter(cable => {
        return cable.name.toLowerCase().includes(searchKey.value.toLowerCase());
      });
    });

    // --------------- ma liste ----- count>0 -------------
    const cablesNonZero = computed(() => {
      return searchInCableTechJoinData.value.filter(c => c.count > 0);
    });

    // --- filtrer liste
    function filtreMaliste() {
      showMyList.value = !showMyList.value;
      console.log("cables", cablesNonZero);
    }

    // choose display cable_type (buttons)
    function selectype(data) {
      // console.log("typechoose", data);
      typechoose.value = data;
    }
    const filteredCableByType = computed(() => {
      return searchInCableTechJoinData.value.filter(
        c => c.type === typechoose.value
      );
    });

    //cableTechLayout button organisation flightcases et
    function cableTechLayout(data) {
      console.log("data cableTechLayout", data);
      cableLayoutData.value = data;
    }
    function openNewAffair(data) {
      debugger;
      console.log("openNewAffair data", data);
      api
        .call("order_get", { affairid: data.affairid })
        .then(response => {
          console.log("order_get:", response);
          orders.value = response;
          // create a view-model joining order items and cables
          aggregateData(response, cables.value);
          affairesRef.value.selectedaff(response);
        })
        .catch(function(response) {
          console.log("order_get:", response);
        });
    }

    return {
      cables,
      cable,
      allOrders,
      affOrders,
      affaire,
      affaireIdToList,
      affairIsOpen,
      affairid,
      affairefrom,
      affaireSelected,
      arrCount,
      arrCountAff,
      totalCountAff,
      // calculOrderCount,
      // calculOrderCountAff,
      calculcables,
      // calculAff,
      orders,
      set_order,
      reserved,
      selectype,
      typechoose,
      filteredCableByType,
      filterCable,
      getAffaireToLabel,
      count,
      countfc,
      countlfc,
      cableid,
      cableIdsInOrders,
      cablesNonZero,
      cableTechJoinedData,
      cableTechLayout,
      cableLayoutData,
      cableTechBase,
      calculateTotal,

      isOpentfc,
      filtreMaliste,
      newAffairOpen,
      order,
      ordersAff,
      modalOpentfc,
      searchInCableTechJoinData,
      searchKey,
      // sommeOrderCountAff,
      showMyList,

      toAffairOpen,
      totalCount,
      updateaffair,
      openNewAffair,
      affairesRef
    };
  }
};
</script>
<style scoped>
button {
  cursor: pointer;
  margin: 10px 15px;
  padding: 5px;
  min-width: 50px;
  background: #ebe7df;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
button.link {
  margin: 0px 0px 3px 0px;
}
.buttonv {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: var(--color1);

  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.button2 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: var(--color2);
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.button3 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: var(--color3);
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
button[type="submit"]:active {
  transform: scale(1.1);
  transition: 0.5s;
}

.content-list-tfc {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid black;
}
.content-liste {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* width: 364px; */
  margin: auto;
  padding: 0px;
}
.content-resume {
  display: flex;
  text-align: left;
  width: 375px;
  justify-content: space-between;
}

.content-number {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.content-button2 {
  display: flex;
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
.flightcases-button {
  display: flex;
  /* width: 150px; */
  padding-left: 130px;
}
.flightcases-button button {
  margin: 11px 15px 11px 5px;
  padding: 5px;
  min-width: 20px;
  background: rgb(211, 210, 210);
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

.head-fc {
  display: flex;
  margin: auto;
  /* width: 105px; */
  height: 20px;
  text-align: left;
  padding-left: 8.4rem;
}
.head-zone {
  display: flex;
  /* margin: auto; */
  /* width: 110px; */
  height: 20px;
  text-align: left;
  padding-left: 128px;
}
.head-zone p {
  line-height: 1px;
  font-size: 0.6rem;
}
.head-zone input {
  width: 28px;
  border: 1px rgb(211, 210, 210);
  font-size: 10px;
  font-weight: 400;
  text-align: center;
}
.head-fc input {
  width: 28px;
  border: 1px rgb(211, 210, 210);
  font-size: 0.6rem;
  font-weight: 400;
  text-align: center;
}

.head-fc p {
  line-height: 1px;
  font-size: 0.75rem;
}

input[type="text"]:hover::placeholder {
  transform: translateY(-15px);
  transition: 0.3s;
}
.info-content {
  height: 14px;
  margin: 0px 0px 10px 0px;
  line-height: 0;
}
.info {
  font-size: 0.75rem;
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
  width: 20px;
}
.list_name {
  width: 220px;
}
.list_container {
  width: 375px;
}
.main {
  /* width: 100%; */
}

.name {
  height: 10px;
  width: 100px;
}
.name h4 {
  /* margin: 10px 0px;
  font-weight: 500;
  text-align: left;
  width: 10px;
  padding: 1px 1px 1px 3px;
 
  background-color: #c1c7c33a;
  border-left: 5px solid #4dcc59; */
}
.number {
  display: flex;
  border-width: 0px 0px 1px 0px;
  align-content: flex-start;
}

.number input {
  width: 18px;
  margin: 2px;
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
  margin: 0px 0px 20px 0px;
  width: 365px;
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
/* #save-liste {
  background-color: rgb(240, 216, 2);
  color: #0c0b0b;
  font-weight: 00;
  box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -webkit-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -moz-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
} */
.search {
  width: 100px;
  margin: 10px 15px 0px;
  height: 15px;
}
.selectedtype {
  color: #fff;
}

.tech {
  width: 200px;
}
/* table {
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
} */
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
.total-flightcase {
  display: flex;
  justify-content: center;
  width: 375px;
  margin: 0px;
  padding: 0px;
}
/* ------------------------------------------------------------------- */
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 32px;
  margin-left: 8px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(216, 211, 207);
  /* background-color: rgb(224, 119, 20); */
  -webkit-transition: 0.4s;
  transition: 0.4s;
  border: 2px solid rgb(13, 216, 47);
}
.sliderder {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* background-color: rgb(216, 211, 207); */
  background-color: rgb(224, 119, 20);
  opacity: 0.3;
  -webkit-transition: 0.4s;
  transition: 0.4s;
  border: 2px solid rgb(13, 216, 47);
}

.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: rgb(224, 119, 20);
  /* background-color: rgb(216, 211, 207); */
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196f3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round,
.sliderder.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
.spare p {
  line-height: 0.8px;
  /* background-color: red; */
}
.toggle-label {
  display: block;
  float: right;
  width: 100px;
  font-size: 0.75rem;
  padding-left: 10px;
}
</style>
