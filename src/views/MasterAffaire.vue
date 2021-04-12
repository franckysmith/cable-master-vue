<template>
  <h1>Gestion des affaires</h1>
  <h2>
    <p>Date du jour: {{ getFormat() }}</p>
  </h2>
  <table class="tab-affaires">
    <tbody>
      <tr
        v-for="affaire in affaires"
        :key="affaire.affairid"
        :class="['clickable ', affaire.done ? '1' : '']"
      >
        <td><input type="checkbox" /></td>
        <td>
          <h4>{{ affaire.name }}</h4>
        </td>
        <td>{{ affaire.tech_name }}</td>
        <td>
          <div class="checkbox">{{ affaire.done }}</div>
        </td>
        <td>{{ format(new Date(affaire.prep_date), "d/ MM /yy ") }}</td>
        <td>{{ format(new Date(affaire.receipt_date), "d/ MM /yy ") }}</td>
      </tr>
    </tbody>
  </table>
  <div>
    <div class="main"></div>
  </div>
</template>

<script>
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";
var api = new Api(url);
// import cablageServices from "@/services/cablage.js";
import { format } from "date-fns";
import { fr } from "date-fns/esm/locale";
import { ref, onMounted } from "vue";

export default {
  name: "MasterAffaire",

  setup() {
    let affaires = ref([]);
    let cables = ref([]);
    let affaire = ref([]);
    // let format = ref("");
    // let dateLocales = { fr: fr, en: enUS };

    // let sortedAffaires = ref([]);

    // let sortedAffaires =ref([]);

    // get affaire
    let affair_get = onMounted(() => {
      api
        .call("affair_get")
        .then(response => {
          affaires.value = response;
          console.log("affair_get:", response);
        })
        .catch(response => {
          console.log("err_affair_get:", response);
        });
    });

    let cable_get = onMounted(() => {
      api
        .call("cable_get")
        .then(response => {
          cables.value = response;
          console.log("cable_get:", response);
        })
        .catch(response => {
          console.log("err_cable_get:", response);
        });
    });

    // let sortedAffaires = computed(() => {
    //   return affaires.value.sort((e1, e2) => {
    //     return e1.affaire.prepa_date < e2.affaire.prepa_date ? 1 : -1;
    //   });
    // });

    // let unarchivedAffaires = computed(() => {
    //   return sortedAffaires.value.filter(e => !e.archived);
    // });

    return {
      affaires,
      affaire,
      cable_get,
      cables,
      affair_get,
      // dateLocales,
      // format,

      fr
      // unarchivedAffaires,
      // sortedAffaires
    };
  },
  data() {
    return {
      format
    };
  },

  methods: {
    getFormat() {
      return this.format(new Date(), "dd MM", { locale: fr });
    }
  }
};
</script>

<style scoped>
.tab-affaires {
  max-width: 1000px;
  margin: auto;
  border-collapse: collapse;
}
.tab-affaires td {
  border-bottom: 1px solid black;
  padding: 5px;
  text-align: left;
}
.tab-affaires tr {
  height: 40px;
}
.checkbox {
  border: 1px solid black;
  padding: 2px;
}
.tab-affaires tr.done {
  background-color: rgb(235, 229, 229);
}
</style>
